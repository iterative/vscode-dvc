import { Memento } from 'vscode'
import { collectChanges, collectMetricsAndParams } from './collect'
import { splitMetricOrParamPath } from './paths'
import { MetricOrParam, MetricOrParamType } from '../webview/contract'
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
        : Object.values<string>(MetricOrParamType).includes(element.parentPath)
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
