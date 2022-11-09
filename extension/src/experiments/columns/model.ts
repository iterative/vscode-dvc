import { EventEmitter, Memento } from 'vscode'
import { collectChanges, collectColumns, collectParamsFiles } from './collect'
import { Column, ColumnType } from '../webview/contract'
import { ExperimentsOutput } from '../../cli/dvc/contract'
import { PersistenceKey } from '../../persistence/constants'
import { PathSelectionModel } from '../../path/selection/model'

export class ColumnsModel extends PathSelectionModel<Column> {
  private columnsOrderChanged: EventEmitter<void>
  private columnOrderState: string[] = []
  private columnWidthsState: Record<string, number> = {}
  private columnsChanges: string[] = []
  private paramsFiles = new Set<string>()

  constructor(
    dvcRoot: string,
    workspaceState: Memento,
    columnsOrderChanged: EventEmitter<void>
  ) {
    super(dvcRoot, workspaceState, PersistenceKey.METRICS_AND_PARAMS_STATUS)

    this.columnOrderState = this.revive(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER,
      []
    )
    this.columnWidthsState = this.revive(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_WIDTHS,
      {}
    )
    this.columnsOrderChanged = columnsOrderChanged
  }

  public getColumnOrder(): string[] {
    return this.columnOrderState
  }

  public getFirstThreeColumnOrder(): string[] {
    return this.columnOrderState.length === 0
      ? this.getFirstThreeColumnOrderFromData()
      : this.columnOrderState.slice(1, 4)
  }

  public getColumnWidths(): Record<string, number> {
    return this.columnWidthsState
  }

  public getParamsFiles() {
    return this.paramsFiles
  }

  public transformAndSet(data: ExperimentsOutput) {
    return Promise.all([
      this.transformAndSetColumns(data),
      this.transformAndSetChanges(data)
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
    this.columnsOrderChanged.fire()
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

  public hasNonDefaultColumns() {
    return this.data.length > 1
  }

  private getFirstThreeColumnOrderFromData(): string[] {
    return this.data
      .filter(({ hasChildren }) => !hasChildren)
      .slice(0, 3)
      .map(({ path }) => path)
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

  private async transformAndSetColumns(data: ExperimentsOutput) {
    const [columns, paramsFiles] = await Promise.all([
      collectColumns(data),
      collectParamsFiles(this.dvcRoot, data)
    ])

    this.setNewStatuses(columns)

    this.data = columns
    this.paramsFiles = paramsFiles
  }

  private transformAndSetChanges(data: ExperimentsOutput) {
    this.columnsChanges = collectChanges(data)
  }
}
