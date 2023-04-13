import { EventEmitter, Memento } from 'vscode'
import {
  collectChanges_,
  collectColumns,
  collectColumns_,
  collectRelativeMetricsFiles,
  collectParamsFiles,
  collectParamsFiles_
} from './collect'
import { EXPERIMENT_COLUMN_ID, timestampColumn } from './constants'
import { Column, ColumnType } from '../webview/contract'
import { ExpShowOutput, ExperimentsOutput } from '../../cli/dvc/contract'
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

  public getFirstThreeColumnOrder(): string[] {
    return this.columnOrderState
      .filter(path => this.status[path] && this.status[path] === 2)
      .slice(0, 3)
  }

  public getColumnWidths(): Record<string, number> {
    return this.columnWidthsState
  }

  public getParamsFiles() {
    return this.paramsFiles
  }

  public getRelativeMetricsFiles() {
    return this.relativeMetricsFiles
  }

  public transformAndSet(data: ExperimentsOutput) {
    return Promise.all([this.transformAndSetColumns(data)])
  }

  public transformAndSet_(data: ExpShowOutput) {
    return Promise.all([
      this.transformAndSetColumns_(data),
      this.transformAndSetChanges_(data)
    ])
  }

  public getChanges() {
    return this.columnsChanges
  }

  public setColumnOrder(columnOrder: string[]) {
    this.columnOrderState = columnOrder
    this.persist(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER,
      this.getColumnOrder()
    )
    this.statusChanged?.fire()
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

  private async transformAndSetColumns(data: ExperimentsOutput) {
    const [columns, paramsFiles] = await Promise.all([
      collectColumns(data),
      collectParamsFiles(this.dvcRoot, data)
    ])

    this.setNewStatuses(columns)

    this.data = columns

    if (this.columnOrderState.length === 0) {
      this.setColumnOrder(this.getColumnOrderFromData())
    }

    this.paramsFiles = paramsFiles
  }

  private async transformAndSetColumns_(data: ExpShowOutput) {
    const [columns, paramsFiles, relativeMetricsFiles] = await Promise.all([
      collectColumns_(data),
      collectParamsFiles_(this.dvcRoot, data),
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

  private transformAndSetChanges_(data: ExpShowOutput) {
    this.columnsChanges = collectChanges_(data)
  }
}
