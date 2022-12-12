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

  public getSelected() {
    return (
      this.data.filter(
        element => this.status[element.path] !== Status.UNSELECTED
      ) || []
    )
  }

  public getTerminalNodes(): (T & { selected: boolean })[] {
    return this.data
      .filter(element => !element.hasChildren)
      .map(element => ({ ...element, selected: !!this.status[element.path] }))
  }

  public toggleStatus(path: string, ...args: unknown[]) {
    const status = this.getNextStatus(path)
    return this.setStatus(path, status, ...args)
  }

  public getTerminalNodeStatuses(
    parentPath?: string,
    ...args: unknown[]
  ): Status[] {
    return (this.getChildren(parentPath, ...args) || []).flatMap(element => {
      const terminalStatuses = element.hasChildren
        ? this.getTerminalNodeStatuses(element.path, ...args)
        : [this.status[element.path]]
      return [...terminalStatuses]
    })
  }

  public setSelected(
    elements: (T & { selected: boolean })[],
    ...args: unknown[]
  ) {
    const terminalNodes = this.getTerminalNodes()
    for (const { path, selected } of terminalNodes) {
      const selectedElement = elements.find(
        ({ path: selectedPath }) => path === selectedPath
      )

      if (!!selectedElement !== !!selected) {
        this.toggleStatus(path, ...args)
      }
    }
  }

  protected setNewStatuses(data: { path: string }[]) {
    for (const { path } of data) {
      if (this.status[path] === undefined) {
        this.status[path] = Status.SELECTED
      }
    }
  }

  protected setStatus(path: string, status: Status, ...args: unknown[]) {
    this.status[path] = status
    this.setAreChildrenSelected(path, status, ...args)
    this.setAreParentsSelected(path, ...args)
    this.persistStatus()
    this.statusChanged?.fire()

    return this.status[path]
  }

  private setAreChildrenSelected(
    path: string,
    status: Status,
    ...args: unknown[]
  ) {
    return this.getChildren(path, ...args)?.map(element => {
      const path = element.path
      this.status[path] = status
      this.setAreChildrenSelected(path, status)
    })
  }

  private getElement(path: T['parentPath']) {
    return this.data?.find(element => element.path === path)
  }

  private setAreParentsSelected(path: string, ...args: unknown[]) {
    const changed = this.getElement(path)
    if (!changed) {
      return
    }
    const parent = this.getElement(changed.parentPath)
    if (!parent) {
      return
    }

    const parentPath = parent.path

    const status = this.getStatus(parentPath, args)
    this.status[parentPath] = status
    this.setAreParentsSelected(parentPath, args)
  }

  private getStatus(parentPath: string, ...args: unknown[]) {
    const statuses = this.getTerminalNodeStatuses(parentPath, ...args)

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
    return this.persist(this.statusKey, this.status)
  }

  abstract getChildren(
    ...args: unknown[]
  ): (T & { descendantStatuses: Status[]; label: string; status: Status })[]
}
