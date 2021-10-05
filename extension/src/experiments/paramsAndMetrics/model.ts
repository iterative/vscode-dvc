import { Event, EventEmitter, Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { collectFiles, collectParamsAndMetrics } from './collect'
import { joinParamOrMetricPath } from './paths'
import { ParamOrMetric } from '../webview/contract'
import { flatten, sameContents } from '../../util/array'
import {
  DiffParamsOrMetricsOutput,
  ExperimentsRepoJSONOutput
} from '../../cli/reader'

export enum Status {
  selected = 2,
  indeterminate = 1,
  unselected = 0
}

export const enum MementoPrefixes {
  status = 'paramsAndMetricsStatus:'
}

export class ParamsAndMetricsModel {
  public dispose = Disposable.fn()

  public onDidChangeParamsAndMetricsFiles: Event<void>
  private paramsAndMetricsFilesChanged = new EventEmitter<void>()

  private status: Record<string, Status>

  private data: ParamOrMetric[] = []
  private files: string[] = []

  private dvcRoot: string
  private workspaceState: Memento

  private paramsAndMetricsChanges: string[] = []

  constructor(dvcRoot: string, workspaceState: Memento) {
    this.dvcRoot = dvcRoot
    this.workspaceState = workspaceState
    this.onDidChangeParamsAndMetricsFiles =
      this.paramsAndMetricsFilesChanged.event
    this.status = workspaceState.get(MementoPrefixes.status + dvcRoot, {})
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
      this.transformAndSetFiles(data)
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

  public getFiles() {
    return this.files
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

  public addChanges(
    type: 'params' | 'metrics',
    diff: DiffParamsOrMetricsOutput
  ) {
    const changes: string[] = []
    const files = Object.keys(diff || [])
    files.forEach(file =>
      changes.push(
        ...Object.keys(diff?.[file] || []).map(diff =>
          joinParamOrMetricPath(type, file, diff)
        )
      )
    )

    this.paramsAndMetricsChanges.push(...changes)
  }

  public resetChanges() {
    this.paramsAndMetricsChanges = []
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

  private transformAndSetFiles(data: ExperimentsRepoJSONOutput) {
    const files = collectFiles(data)

    if (sameContents(this.files, files)) {
      return
    }

    this.files = files
    this.paramsAndMetricsFilesChanged.fire()
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
