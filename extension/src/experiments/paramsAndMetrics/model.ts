import { Event, EventEmitter, Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { collectFiles, collectParamsAndMetrics } from './collect'
import { ParamOrMetric } from '../webview/contract'
import { flatten, sameContents } from '../../util/array'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'
import { messenger, MessengerEvents } from '../../util/messaging'

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

  private columnState: ParamOrMetric[] = []

  private columnOrderChanged: EventEmitter<void>

  static getCleanPath(path: string): string {
    return path.split('/')[1]
  }

  constructor(
    dvcRoot: string,
    workspaceState: Memento,
    columnOrderChanged: EventEmitter<void>
  ) {
    this.dvcRoot = dvcRoot
    this.workspaceState = workspaceState
    this.columnOrderChanged = columnOrderChanged
    this.onDidChangeParamsAndMetricsFiles =
      this.paramsAndMetricsFilesChanged.event
    this.status = workspaceState.get(MementoPrefixes.status + dvcRoot, {})

    messenger.on(MessengerEvents.columnReordered, (columnOrder: string[]) => {
      this.setColumnState(columnOrder)
    })
  }

  public setColumnState(newState?: string[]) {
    const orderedPaths: string[] =
      newState || this.getTerminalNodes().map(node => node.path)

    const previousGroups: string[] = []
    const orderedData = [
      ...orderedPaths
        .map(path => ({ ...this.data.find(column => column.path === path) }))
        .filter(Boolean)
    ] as ParamOrMetric[]

    let previousGroup = orderedData[0].parentPath

    orderedData.forEach(node => {
      const { parentPath, path } = node

      if (parentPath !== previousGroup) {
        previousGroups.push(previousGroup)
        previousGroup = parentPath
      }

      const groupNumberPrefix = `${previousGroups.length}/`

      node.path = groupNumberPrefix + path
      node.parentPath = groupNumberPrefix + parentPath

      const parentNode = {
        ...this.data.find(column => column.path === parentPath)
      } as ParamOrMetric
      parentNode.path = groupNumberPrefix + parentPath

      if (!orderedData.find(column => column.path === parentNode.path)) {
        orderedData.push(parentNode)
      }
    })
    this.columnState = orderedData
    this.columnOrderChanged.fire()
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
    const groups = [...new Set(this.columnState.map(column => column.group))]
    return this.columnState
      ?.filter(paramOrMetric =>
        path
          ? paramOrMetric.parentPath === path
          : groups.includes(paramOrMetric.parentPath)
      )
      .map(paramOrMetric => {
        const path = ParamsAndMetricsModel.getCleanPath(paramOrMetric.path)
        return {
          ...paramOrMetric,
          descendantStatuses: this.getTerminalNodeStatuses(path),
          status: this.status[path]
        }
      })
  }

  public getFiles() {
    return this.files
  }

  public toggleStatus(path: string) {
    const originalPath = ParamsAndMetricsModel.getCleanPath(path)
    const status = this.getNextStatus(originalPath)
    this.status[originalPath] = status
    this.setAreChildrenSelected(path, status)
    this.setAreParentsSelected(path)
    this.persistStatus()

    return this.status[originalPath]
  }

  public getTerminalNodeStatuses(parentPath?: string): Status[] {
    const nestedStatuses = (this.getChildren(parentPath) || []).map(
      paramOrMetric => {
        const originalPath = ParamsAndMetricsModel.getCleanPath(
          paramOrMetric.path
        )
        const terminalStatuses = paramOrMetric.hasChildren
          ? this.getTerminalNodeStatuses(paramOrMetric.path)
          : [this.status[originalPath]]
        return [...terminalStatuses]
      }
    )

    return flatten<Status>(nestedStatuses)
  }

  private transformAndSetParamsAndMetrics(data: ExperimentsRepoJSONOutput) {
    const paramsAndMetrics = collectParamsAndMetrics(data)

    paramsAndMetrics.forEach(paramOrMetric => {
      if (this.status[paramOrMetric.path] === undefined) {
        this.status[paramOrMetric.path] = Status.selected
      }
    })

    this.data = paramsAndMetrics
    this.setColumnState()
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
      const originalPath = ParamsAndMetricsModel.getCleanPath(path)
      this.status[originalPath] = status
      this.setAreChildrenSelected(path, status)
    })
  }

  private getParamOrMetric(path: string) {
    return this.columnState?.find(paramOrMetric => paramOrMetric.path === path)
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
    const originalParentPath = ParamsAndMetricsModel.getCleanPath(parentPath)
    const status = this.getStatus(parentPath)
    this.status[originalParentPath] = status
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
