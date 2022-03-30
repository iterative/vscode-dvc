import { Memento } from 'vscode'
import { collectChanges, collectMetricsAndParams } from './collect'
import { splitMetricOrParamPath } from './paths'
import { MetricOrParam } from '../webview/contract'
import { ExperimentsOutput } from '../../cli/reader'
import { PersistenceKey } from '../../persistence/constants'
import { PathSelectionModel } from '../../path/selection/model'

export class MetricsAndParamsModel extends PathSelectionModel<MetricOrParam> {
  private columnOrderState: string[] = []
  private columnWidthsState: Record<string, number> = {}
  private metricsAndParamsChanges: string[] = []

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(
      dvcRoot,
      workspaceState,
      PersistenceKey.METRICS_AND_PARAMS_STATUS,
      splitMetricOrParamPath
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

  public transformAndSet(data: ExperimentsOutput) {
    return Promise.all([
      this.transformAndSetMetricsAndParams(data),
      this.transformAndSetChanges(data)
    ])
  }

  public getChanges() {
    return this.metricsAndParamsChanges
  }

  public setColumnOrder(columnOrder: string[]) {
    this.columnOrderState = columnOrder
    this.persistColumnOrder()
  }

  public setColumnWidth(id: string, width: number) {
    this.columnWidthsState[id] = width
    this.persistColumnWidths()
  }

  public filterChildren(path?: string) {
    return this.data.filter(element =>
      path
        ? element.parentPath === path
        : ['metrics', 'params'].includes(element.parentPath)
    )
  }

  private persistColumnOrder() {
    this.persist(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_ORDER,
      this.getColumnOrder()
    )
  }

  private persistColumnWidths() {
    this.persist(
      PersistenceKey.METRICS_AND_PARAMS_COLUMN_WIDTHS,
      this.columnWidthsState
    )
  }

  private transformAndSetMetricsAndParams(data: ExperimentsOutput) {
    const metricsAndParams = collectMetricsAndParams(data)

    this.setNewStatuses(metricsAndParams)

    this.data = metricsAndParams
  }

  private transformAndSetChanges(data: ExperimentsOutput) {
    this.metricsAndParamsChanges = collectChanges(data)
  }
}
