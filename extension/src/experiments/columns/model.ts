import { EventEmitter, Memento } from 'vscode'
import {
  collectChanges,
  collectColumns,
  collectRelativeMetricsFiles,
  collectParamsFiles
} from './collect'
import { EXPERIMENT_COLUMN_ID, timestampColumn } from './constants'
import {
  MAX_SUMMARY_ORDER_LENGTH,
  SummaryAcc,
  collectFromColumnOrder as collectSummaryColumnOrder,
  limitSummaryOrder
} from './util'
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
    const columnOrder = [
      'id',
      ...firstColumns,
      ...this.getColumnOrder().filter(
        column => !['id', ...firstColumns].includes(column)
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

  private findChildrenColumns(
    parent: string,
    columns: Column[],
    childrenColumns: string[]
  ) {
    const filteredColumns = columns.filter(
      ({ parentPath }) => parentPath === parent
    )
    for (const column of filteredColumns) {
      if (column.hasChildren) {
        this.findChildrenColumns(column.path, columns, childrenColumns)
      } else {
        childrenColumns.push(column.path)
      }
    }
  }

  private getColumnsFromType(type: string): string[] {
    const childrenColumns: string[] = []
    const dataWithType = this.data.filter(({ path }) => path.startsWith(type))
    this.findChildrenColumns(type, dataWithType, childrenColumns)
    return childrenColumns
  }

  private getColumnOrderFromData() {
    return [
      EXPERIMENT_COLUMN_ID,
      timestampColumn.path,
      ...this.getColumnsFromType(ColumnType.METRICS),
      ...this.getColumnsFromType(ColumnType.PARAMS),
      ...this.getColumnsFromType(ColumnType.DEPS)
    ]
  }

  private async transformAndSetColumns(data: ExpShowOutput) {
    const [columns, paramsFiles, relativeMetricsFiles] = await Promise.all([
      collectColumns(data),
      collectParamsFiles(this.dvcRoot, data),
      collectRelativeMetricsFiles(data)
    ])

    this.setNewStatuses(columns)

    this.data = columns

    if (this.columnOrderState.length === 0) {
      this.setColumnOrder(this.getColumnOrderFromData())
    }

    this.paramsFiles = paramsFiles
    this.relativeMetricsFiles = relativeMetricsFiles
  }

  private transformAndSetChanges(data: ExpShowOutput) {
    this.columnsChanges = collectChanges(data)
  }
}
