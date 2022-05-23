import { Memento } from 'vscode'
import { collectChanges, collectColumns, collectParamsFiles } from './collect'
import { splitColumnPath } from './paths'
import { Column, ColumnType } from '../webview/contract'
import { ExperimentsOutput } from '../../cli/reader'
import { PersistenceKey } from '../../persistence/constants'
import { PathSelectionModel } from '../../path/selection/model'

export class ColumnsModel extends PathSelectionModel<Column> {
  private columnOrderState: string[] = []
  private columnWidthsState: Record<string, number> = {}
  private columnsChanges: string[] = []
  private paramsFiles = new Set<string>()

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(
      dvcRoot,
      workspaceState,
      PersistenceKey.METRICS_AND_PARAMS_STATUS,
      splitColumnPath
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
  }

  public setColumnWidth(id: string, width: number) {
    this.columnWidthsState[id] = width
    this.persist(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_WIDTHS,
      this.columnWidthsState
    )
  }

  public filterChildren(path?: string) {
    return this.data.filter(element =>
      path
        ? element.parentPath === path
        : Object.values<string>(ColumnType).includes(element.parentPath)
    )
  }

  public hasColumns() {
    return this.data.length > 0
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
