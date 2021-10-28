import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { collectChanges, collectParamsAndMetrics } from './collect'
import { ParamOrMetric } from '../webview/contract'
import { flatten } from '../../util/array'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'

export enum Status {
  selected = 2,
  indeterminate = 1,
  unselected = 0
}

export const enum MementoPrefixes {
  status = 'paramsAndMetricsStatus:',
  columnsOrder = 'paramsAndMetricsColumnsOrder:'
}

export class ParamsAndMetricsModel {
  public dispose = Disposable.fn()

  private status: Record<string, Status>

  private data: ParamOrMetric[] = []

  private dvcRoot: string
  private workspaceState: Memento

  private columnsOrderState: string[] = []
  private paramsAndMetricsChanges: string[] = []

  constructor(dvcRoot: string, workspaceState: Memento) {
    this.dvcRoot = dvcRoot
    this.workspaceState = workspaceState
    this.status = workspaceState.get(MementoPrefixes.status + dvcRoot, {})
    this.columnsOrderState = workspaceState.get(
      MementoPrefixes.columnsOrder + dvcRoot,
      []
    )
  }

  public getColumnsOrder(): string[] {
    return this.columnsOrderState
  }

  public getSelected() {
    return (
      this.data.filter(
        paramOrMetric => this.status[paramOrMetric.path] !== Status.unselected
      ) || []
    )
  }

  public transformAndSet(data: ExperimentsRepoJSONOutput) {
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

  public setColumnsOrder(columnsOrder: string[]) {
    this.columnsOrderState = columnsOrder
    this.workspaceState.update(
      MementoPrefixes.columnsOrder + this.dvcRoot,
      this.getColumnsOrder()
    )
  }

  private transformAndSetParamsAndMetrics(data: ExperimentsRepoJSONOutput) {
    const paramsAndMetrics = collectParamsAndMetrics(data)

    paramsAndMetrics.forEach(paramOrMetric => {
      if (this.status[paramOrMetric.path] === undefined) {
        this.status[paramOrMetric.path] = Status.selected
      }
    })

    this.data = paramsAndMetrics
  }

  private transformAndSetChanges(data: ExperimentsRepoJSONOutput) {
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

    const isAnyChildSelected = statuses.includes(Status.selected)
    const isAnyChildUnselected = statuses.includes(Status.unselected)

    if (isAnyChildSelected && isAnyChildUnselected) {
      return Status.indeterminate
    }

    if (!isAnyChildUnselected) {
      return Status.selected
    }

    return Status.unselected
  }

  private getNextStatus(path: string) {
    const status = this.status[path]
    if (status === Status.selected) {
      return Status.unselected
    }
    return Status.selected
  }

  private persistStatus() {
    return this.workspaceState.update(
      MementoPrefixes.status + this.dvcRoot,
      this.status
    )
  }
}
