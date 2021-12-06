import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { collectChanges, collectParamsAndMetrics } from './collect'
import { ParamOrMetric } from '../webview/contract'
import { flatten } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'

export enum Status {
  SELECTED = 2,
  INDETERMINATE = 1,
  UNSELECTED = 0
}

export const enum MementoPrefixes {
  STATUS = 'paramsAndMetricsStatus:',
  COLUMN_ORDER = 'paramsAndMetricsColumnOrder:',
  COLUMN_WIDTHS = 'paramsAndMetricsColumnWidths:'
}

export class ParamsAndMetricsModel {
  public readonly dispose = Disposable.fn()

  private status: Record<string, Status>

  private data: ParamOrMetric[] = []

  private readonly dvcRoot: string
  private readonly workspaceState: Memento

  private columnOrderState: string[] = []
  private columnWidthsState: Record<string, number> = {}
  private paramsAndMetricsChanges: string[] = []

  constructor(dvcRoot: string, workspaceState: Memento) {
    this.dvcRoot = dvcRoot
    this.workspaceState = workspaceState
    this.status = workspaceState.get(MementoPrefixes.STATUS + dvcRoot, {})
    this.columnOrderState = workspaceState.get(
      MementoPrefixes.COLUMN_ORDER + dvcRoot,
      []
    )
    this.columnWidthsState = workspaceState.get(
      MementoPrefixes.COLUMN_WIDTHS + dvcRoot,
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
        paramOrMetric => this.status[paramOrMetric.path] !== Status.UNSELECTED
      ) || []
    )
  }

  public transformAndSet(data: ExperimentsOutput) {
    return Promise.all([
      this.transformAndSetParamsAndMetrics(data),
      this.transformAndSetChanges(data)
    ])
  }

  public getParamsAndMetrics() {
    return this.data
  }

  public getTerminalNodes() {
    return this.data.filter(paramOrMetric => !paramOrMetric.hasChildren)
  }

  public getChildren(path?: string) {
    return this.data
      ?.filter(paramOrMetric =>
        path
          ? paramOrMetric.parentPath === path
          : ['metrics', 'params'].includes(paramOrMetric.parentPath)
      )
      .map(paramOrMetric => {
        return {
          ...paramOrMetric,
          descendantStatuses: this.getTerminalNodeStatuses(paramOrMetric.path),
          status: this.status[paramOrMetric.path]
        }
      })
  }

  public getChanges() {
    return this.paramsAndMetricsChanges
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
      paramOrMetric => {
        const terminalStatuses = paramOrMetric.hasChildren
          ? this.getTerminalNodeStatuses(paramOrMetric.path)
          : [this.status[paramOrMetric.path]]
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
      MementoPrefixes.COLUMN_ORDER + this.dvcRoot,
      this.getColumnOrder()
    )
  }

  private persistColumnWidths() {
    this.workspaceState.update(
      MementoPrefixes.COLUMN_WIDTHS + this.dvcRoot,
      this.columnWidthsState
    )
  }

  private transformAndSetParamsAndMetrics(data: ExperimentsOutput) {
    const paramsAndMetrics = collectParamsAndMetrics(data)

    paramsAndMetrics.forEach(paramOrMetric => {
      if (this.status[paramOrMetric.path] === undefined) {
        this.status[paramOrMetric.path] = Status.SELECTED
      }
    })

    this.data = paramsAndMetrics
  }

  private transformAndSetChanges(data: ExperimentsOutput) {
    this.paramsAndMetricsChanges = collectChanges(data)
  }

  private setAreChildrenSelected(path: string, status: Status) {
    return this.getChildren(path)?.map(paramOrMetric => {
      const path = paramOrMetric.path
      this.status[path] = status
      this.setAreChildrenSelected(path, status)
    })
  }

  private getParamOrMetric(path: string) {
    return this.data?.find(paramOrMetric => paramOrMetric.path === path)
  }

  private setAreParentsSelected(path: string) {
    const changed = this.getParamOrMetric(path)
    if (!changed) {
      return
    }
    const parent = this.getParamOrMetric(changed.parentPath)
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
      MementoPrefixes.STATUS + this.dvcRoot,
      this.status
    )
  }
}
