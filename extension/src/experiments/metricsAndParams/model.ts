import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { collectChanges, collectMetricsAndParams } from './collect'
import { MetricOrParam } from '../webview/contract'
import { flatten } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { MementoPrefix } from '../../vscode/memento'

export enum Status {
  SELECTED = 2,
  INDETERMINATE = 1,
  UNSELECTED = 0
}

export class MetricsAndParamsModel {
  public readonly dispose = Disposable.fn()

  private status: Record<string, Status>

  private data: MetricOrParam[] = []

  private readonly dvcRoot: string
  private readonly workspaceState: Memento

  private columnOrderState: string[] = []
  private columnWidthsState: Record<string, number> = {}
  private metricsAndParamsChanges: string[] = []

  constructor(dvcRoot: string, workspaceState: Memento) {
    this.dvcRoot = dvcRoot
    this.workspaceState = workspaceState
    this.status = workspaceState.get(
      MementoPrefix.METRICS_AND_PARAMS_STATUS + dvcRoot,
      {}
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

  public getSelected() {
    return (
      this.data.filter(
        metricOrParam => this.status[metricOrParam.path] !== Status.UNSELECTED
      ) || []
    )
  }

  public transformAndSet(data: ExperimentsOutput) {
    return Promise.all([
      this.transformAndSetMetricsAndParams(data),
      this.transformAndSetChanges(data)
    ])
  }

  public getTerminalNodes() {
    return this.data.filter(metricOrParam => !metricOrParam.hasChildren)
  }

  public getChildren(path?: string) {
    return this.data
      ?.filter(metricOrParam =>
        path
          ? metricOrParam.parentPath === path
          : ['metrics', 'params'].includes(metricOrParam.parentPath)
      )
      .map(metricOrParam => {
        return {
          ...metricOrParam,
          descendantStatuses: this.getTerminalNodeStatuses(metricOrParam.path),
          status: this.status[metricOrParam.path]
        }
      })
  }

  public getChanges() {
    return this.metricsAndParamsChanges
  }

  public toggleStatus(path: string) {
    const status = this.getNextStatus(path)
    this.status[path] = status
    this.setAreChildrenSelected(path, status)
    this.setAreParentsSelected(path)
    this.persistStatus()

    return this.status[path]
  }

  public getTerminalNodeStatuses(parentPath?: string): Status[] {
    const nestedStatuses = (this.getChildren(parentPath) || []).map(
      metricOrParam => {
        const terminalStatuses = metricOrParam.hasChildren
          ? this.getTerminalNodeStatuses(metricOrParam.path)
          : [this.status[metricOrParam.path]]
        return [...terminalStatuses]
      }
    )

    return flatten<Status>(nestedStatuses)
  }

  public setColumnOrder(columnOrder: string[]) {
    this.columnOrderState = columnOrder
    this.persistColumnOrder()
  }

  public setColumnWidth(id: string, width: number) {
    this.columnWidthsState[id] = width
    this.persistColumnWidths()
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

    metricsAndParams.forEach(metricOrParam => {
      if (this.status[metricOrParam.path] === undefined) {
        this.status[metricOrParam.path] = Status.SELECTED
      }
    })

    this.data = metricsAndParams
  }

  private transformAndSetChanges(data: ExperimentsOutput) {
    this.metricsAndParamsChanges = collectChanges(data)
  }

  private setAreChildrenSelected(path: string, status: Status) {
    return this.getChildren(path)?.map(metricOrParam => {
      const path = metricOrParam.path
      this.status[path] = status
      this.setAreChildrenSelected(path, status)
    })
  }

  private getMetricOrParam(path: string) {
    return this.data?.find(metricOrParam => metricOrParam.path === path)
  }

  private setAreParentsSelected(path: string) {
    const changed = this.getMetricOrParam(path)
    if (!changed) {
      return
    }
    const parent = this.getMetricOrParam(changed.parentPath)
    if (!parent) {
      return
    }

    const parentPath = parent.path

    const status = this.getStatus(parentPath)
    this.status[parentPath] = status
    this.setAreParentsSelected(parentPath)
  }

  private getStatus(parentPath: string) {
    const statuses = this.getTerminalNodeStatuses(parentPath)

    const isAnyChildSelected = statuses.includes(Status.SELECTED)
    const isAnyChildUnselected = statuses.includes(Status.UNSELECTED)

    if (isAnyChildSelected && isAnyChildUnselected) {
      return Status.INDETERMINATE
    }

    if (!isAnyChildUnselected) {
      return Status.SELECTED
    }

    return Status.UNSELECTED
  }

  private getNextStatus(path: string) {
    const status = this.status[path]
    if (status === Status.SELECTED) {
      return Status.UNSELECTED
    }
    return Status.SELECTED
  }

  private persistStatus() {
    return this.workspaceState.update(
      MementoPrefix.METRICS_AND_PARAMS_STATUS + this.dvcRoot,
      this.status
    )
  }
}
