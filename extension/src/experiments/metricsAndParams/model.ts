import { Memento } from 'vscode'
import { collectChanges, collectMetricsAndParams } from './collect'
import { splitMetricOrParamPath } from './paths'
import { MetricOrParam } from '../webview/contract'
import { ExperimentsOutput } from '../../cli/reader'
import { MementoPrefix } from '../../vscode/memento'
import { PathSelectionModel } from '../../path/selection/model'

export class MetricsAndParamsModel extends PathSelectionModel<MetricOrParam> {
  private columnOrderState: string[] = []
  private columnWidthsState: Record<string, number> = {}
  private metricsAndParamsChanges: string[] = []

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(
      dvcRoot,
      workspaceState,
      MementoPrefix.METRICS_AND_PARAMS_STATUS,
      splitMetricOrParamPath
    )

    this.columnOrderState = workspaceState.get(
      MementoPrefix.METRICS_AND_PARAMS_COLUMN_ORDER + dvcRoot,
      []
    )
    this.columnWidthsState = workspaceState.get(
      MementoPrefix.METRICS_AND_PARAMS_COLUMN_WIDTHS + dvcRoot,
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
    this.workspaceState.update(
      MementoPrefix.METRICS_AND_PARAMS_COLUMN_ORDER + this.dvcRoot,
      this.getColumnOrder()
    )
  }

  private persistColumnWidths() {
    this.workspaceState.update(
      MementoPrefix.METRICS_AND_PARAMS_COLUMN_WIDTHS + this.dvcRoot,
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
