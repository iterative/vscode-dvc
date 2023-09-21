import { EventEmitter, Memento } from 'vscode'
import {
  collectChanges,
  collectColumns,
  collectRelativeMetricsFiles,
  collectParamsFiles
} from './collect'
import {
  MAX_SUMMARY_ORDER_LENGTH,
  SummaryAcc,
  collectFromColumnOrder as collectSummaryColumnOrder,
  limitSummaryOrder
} from './util'
import { collectColumnOrder } from './collect/order'
import {
  BRANCH_COLUMN_ID,
  COMMIT_COLUMN_ID,
  DEFAULT_COLUMN_IDS
} from './constants'
import { Column, ColumnType } from '../webview/contract'
import { ExpShowOutput } from '../../cli/dvc/contract'
import { PersistenceKey } from '../../persistence/constants'
import { PathSelectionModel, Status } from '../../path/selection/model'

export class ColumnsModel extends PathSelectionModel<Column> {
  private columnOrderState: string[] = []
  private columnWidthsState: Record<string, number> = {}
  private columnsChanges: string[] = []
  private paramsFiles = new Set<string>()
  private relativeMetricsFiles: string[] = []
  private showOnlyChanged: boolean

  constructor(
    dvcRoot: string,
    workspaceState: Memento,
    columnsOrderOrStatusChanged: EventEmitter<void>
  ) {
    super(
      dvcRoot,
      workspaceState,
      PersistenceKey.METRICS_AND_PARAMS_STATUS,
      columnsOrderOrStatusChanged
    )

    this.columnOrderState = this.revive(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER,
      []
    )
    this.columnWidthsState = this.revive(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_WIDTHS,
      {}
    )
    this.showOnlyChanged = this.revive(PersistenceKey.SHOW_ONLY_CHANGED, false)
  }

  public getColumnOrder(): string[] {
    return this.columnOrderState
  }

  public getSummaryColumnOrder(): string[] {
    const acc: SummaryAcc = { metrics: [], params: [] }
    for (const path of this.columnOrderState) {
      const reachedMaxSummaryOrderLength =
        acc.metrics.length >= MAX_SUMMARY_ORDER_LENGTH &&
        acc.params.length >= MAX_SUMMARY_ORDER_LENGTH
      if (reachedMaxSummaryOrderLength) {
        return limitSummaryOrder(acc)
      }
      if (this.status[path] !== Status.SELECTED) {
        continue
      }
      collectSummaryColumnOrder(path, acc)
    }

    return limitSummaryOrder(acc)
  }

  public getColumnWidths(): Record<string, number> {
    return this.columnWidthsState
  }

  public getParamsFiles() {
    return this.paramsFiles
  }

  public transformAndSet(data: ExpShowOutput) {
    return Promise.all([
      this.transformAndSetColumns(data),
      this.transformAndSetChanges(data)
    ])
  }

  public getChanges() {
    return this.columnsChanges
  }

  public getRelativeMetricsFiles() {
    return this.relativeMetricsFiles
  }

  public setColumnOrder(columnOrder: string[]) {
    this.columnOrderState = columnOrder
    this.persist(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER,
      this.getColumnOrder()
    )
    this.statusChanged?.fire()
  }

  public selectFirst(firstColumns: string[]) {
    const defaultColumns = DEFAULT_COLUMN_IDS
    const columnOrder = [
      ...defaultColumns,
      ...firstColumns,
      ...this.getColumnOrder().filter(
        column => ![...defaultColumns, ...firstColumns].includes(column)
      )
    ]
    this.setColumnOrder(columnOrder)
  }

  public setColumnWidth(id: string, width: number) {
    this.columnWidthsState[id] = width
    this.persist(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_WIDTHS,
      this.columnWidthsState
    )
  }

  public getShowOnlyChanged() {
    return this.showOnlyChanged
  }

  public toggleShowOnlyChanged() {
    this.showOnlyChanged = !this.showOnlyChanged
    this.persist(PersistenceKey.SHOW_ONLY_CHANGED, this.showOnlyChanged)
  }

  public getChildren(path: string | undefined) {
    return this.filterChildren(path).map(element => {
      return {
        ...element,
        descendantStatuses: this.getTerminalNodeStatuses(element.path),
        label: element.label,
        status: this.status[element.path]
      }
    })
  }

  public getTerminalNodes(): (Column & { selected: boolean })[] {
    return this.data
      .filter(element => !element.hasChildren)
      .map(element => ({ ...element, selected: !!this.status[element.path] }))
  }

  public getSelected() {
    return (
      this.data.filter(
        element => this.status[element.path] !== Status.UNSELECTED
      ) || []
    )
  }

  public hasNonDefaultColumns() {
    return this.data.length > 1
  }

  private filterChildren(path?: string) {
    return this.data.filter(element =>
      path
        ? element.parentPath === path
        : Object.values<string>(ColumnType).includes(
            element.parentPath || element.type
          )
    )
  }

  private async setColumnOrderFromData(terminalNodes: Column[]) {
    const extendedColumnOrder = await collectColumnOrder(
      this.columnOrderState,
      terminalNodes
    )

    this.setColumnOrder(extendedColumnOrder)
  }

  private async transformAndSetColumns(data: ExpShowOutput) {
    const [columns, paramsFiles, relativeMetricsFiles] = await Promise.all([
      collectColumns(data),
      collectParamsFiles(this.dvcRoot, data),
      collectRelativeMetricsFiles(data)
    ])

    this.setNewStatuses(columns)

    this.data = columns

    this.paramsFiles = paramsFiles
    this.relativeMetricsFiles = relativeMetricsFiles

    const selectedColumns = this.getTerminalNodes().filter(
      ({ selected }) => selected
    )

    for (const { path } of selectedColumns) {
      if (!this.columnOrderState.includes(path)) {
        return this.setColumnOrderFromData(selectedColumns)
      }
    }

    const maybeMissingDefaultColumns = [COMMIT_COLUMN_ID, BRANCH_COLUMN_ID]
    for (const id of maybeMissingDefaultColumns) {
      if (!this.columnOrderState.includes(id)) {
        return this.setColumnOrderFromData(selectedColumns)
      }
    }
  }

  private transformAndSetChanges(data: ExpShowOutput) {
    this.columnsChanges = collectChanges(data)
  }
}
