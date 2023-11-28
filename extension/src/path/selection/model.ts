import { EventEmitter, Memento } from 'vscode'
import { PersistenceKey } from '../../persistence/constants'
import { ModelWithPersistence } from '../../persistence/model'
import { Column } from '../../experiments/webview/contract'
import { PlotPath } from '../../plots/paths/collect'

export enum Status {
  SELECTED = 2,
  INDETERMINATE = 1,
  UNSELECTED = 0
}

export abstract class PathSelectionModel<
  T extends Column | PlotPath
> extends ModelWithPersistence {
  protected status: Record<string, Status>

  protected data: T[] = []

  protected statusChanged?: EventEmitter<void>
  private readonly statusKey: PersistenceKey

  constructor(
    dvcRoot: string,
    workspaceState: Memento,
    statusKey: PersistenceKey,
    statusChanged?: EventEmitter<void>
  ) {
    super(dvcRoot, workspaceState)

    this.statusKey = statusKey
    this.status = workspaceState.get(this.statusKey + dvcRoot, {})
    if (statusChanged) {
      this.statusChanged = statusChanged
    }
  }

  public toggleStatus(path: string) {
    const status = this.getNextStatus(path)
    return this.setStatus(path, status)
  }

  public unselect(path: string) {
    return this.setStatus(path, Status.UNSELECTED)
  }

  public getTerminalNodeStatuses(parentPath?: string): Status[] {
    return (this.getChildren(parentPath) || []).flatMap(element => {
      const terminalStatuses = (element as T).hasChildren
        ? this.getTerminalNodeStatuses(element.path)
        : [this.status[element.path]]
      return [...terminalStatuses]
    })
  }

  public setSelected(elements: (T & { selected: boolean })[]) {
    const terminalNodes = this.getTerminalNodes()
    for (const { path, selected } of terminalNodes) {
      const selectedElement = elements.find(
        ({ path: selectedPath }) => path === selectedPath
      )

      if (!!selectedElement !== !!selected) {
        this.toggleStatus(path)
      }
    }
  }

  protected setNewStatuses(data: { path: string }[]) {
    const paths = new Set<string>()
    for (const { path } of data) {
      if (this.status[path] === undefined) {
        this.status[path] = Status.SELECTED
      }
      paths.add(path)
    }

    this.removeMissingSelected(paths)
  }

  protected removeMissingSelected(paths: Set<string>) {
    for (const [path, status] of Object.entries(this.status)) {
      if (!paths.has(path) && status === Status.SELECTED) {
        delete this.status[path]
      }
    }
  }

  protected getStatus(parentPath: string) {
    const statuses = this.getTerminalNodeStatuses(parentPath)

    const isAnyChildSelected = statuses.includes(Status.SELECTED)
    const isAnyChildUnselected =
      statuses.includes(Status.UNSELECTED) ||
      statuses.filter(Boolean).length < statuses.length

    if (isAnyChildSelected && isAnyChildUnselected) {
      return Status.INDETERMINATE
    }

    if (!isAnyChildUnselected) {
      return Status.SELECTED
    }

    return Status.UNSELECTED
  }

  private setStatus(path: string, status: Status) {
    this.status[path] = status
    this.setAreChildrenSelected(path, status)
    this.setAreParentsSelected(path)
    this.persistStatus()
    this.statusChanged?.fire()

    return this.status[path]
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

  private getNextStatus(path: string) {
    const status = this.status[path]
    if (status === Status.SELECTED) {
      return Status.UNSELECTED
    }
    return Status.SELECTED
  }

  private persistStatus() {
    return this.persist(this.statusKey, this.status)
  }

  abstract getChildren(
    ...args: unknown[]
  ):
    | (T & { descendantStatuses: Status[]; status: Status })[]
    | { error: string; path: string }[]

  abstract getTerminalNodes(): (T & { selected: boolean })[]
}
