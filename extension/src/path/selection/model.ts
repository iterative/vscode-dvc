import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { MetricOrParam } from '../../experiments/webview/contract'
import { PlotPath } from '../../plots/paths/collect'
import { flatten } from '../../util/array'
import { MementoPrefix } from '../../vscode/memento'

export enum Status {
  SELECTED = 2,
  INDETERMINATE = 1,
  UNSELECTED = 0
}

export abstract class PathSelectionModel<T extends MetricOrParam | PlotPath> {
  public readonly dispose = Disposable.fn()

  protected status: Record<string, Status>

  protected data: T[] = []

  protected readonly dvcRoot: string
  protected readonly workspaceState: Memento

  private readonly statusKey: MementoPrefix

  constructor(
    dvcRoot: string,
    workspaceState: Memento,
    statusKey: MementoPrefix
  ) {
    this.dvcRoot = dvcRoot
    this.workspaceState = workspaceState
    this.statusKey = statusKey
    this.status = workspaceState.get(this.statusKey + dvcRoot, {})
  }

  public getSelected() {
    return (
      this.data.filter(
        element => this.status[element.path] !== Status.UNSELECTED
      ) || []
    )
  }

  public getTerminalNodes() {
    return this.data.filter(element => !element.hasChildren)
  }

  public getChildren(path?: string) {
    return this.filterChildren(path).map(element => {
      return {
        ...element,
        descendantStatuses: this.getTerminalNodeStatuses(element.path),
        status: this.status[element.path]
      }
    })
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
    const nestedStatuses = (this.getChildren(parentPath) || []).map(element => {
      const terminalStatuses = element.hasChildren
        ? this.getTerminalNodeStatuses(element.path)
        : [this.status[element.path]]
      return [...terminalStatuses]
    })

    return flatten<Status>(nestedStatuses)
  }

  private setAreChildrenSelected(path: string, status: Status) {
    return this.getChildren(path)?.map(element => {
      const path = element.path
      this.status[path] = status
      this.setAreChildrenSelected(path, status)
    })
  }

  private getElement(path: T['parentPath']) {
    return this.data?.find(element => element.path === path)
  }

  private setAreParentsSelected(path: string) {
    const changed = this.getElement(path)
    if (!changed) {
      return
    }
    const parent = this.getElement(changed.parentPath)
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
      this.statusKey + this.dvcRoot,
      this.status
    )
  }

  abstract filterChildren(path?: string): T[]
}
