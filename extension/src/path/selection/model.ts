import { Memento } from 'vscode'
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

  private readonly statusKey: PersistenceKey

  private readonly splitFunc: (path: string) => string[]

  constructor(
    dvcRoot: string,
    workspaceState: Memento,
    statusKey: PersistenceKey,
    splitFunc: (path: string) => string[]
  ) {
    super(dvcRoot, workspaceState)

    this.statusKey = statusKey
    this.status = workspaceState.get(this.statusKey + dvcRoot, {})
    this.splitFunc = splitFunc
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

  public getChildren(path: string | undefined) {
    return this.filterChildren(path).map(element => {
      return {
        ...element,
        descendantStatuses: this.getTerminalNodeStatuses(element.path),
        label: this.getLabel(element.path),
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
    return (this.getChildren(parentPath) || []).flatMap(element => {
      const terminalStatuses = element.hasChildren
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
    for (const { path } of data) {
      if (this.status[path] === undefined) {
        this.status[path] = Status.SELECTED
      }
    }
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
    return this.persist(this.statusKey, this.status)
  }

  private getLabel(path: string) {
    const [label] = this.splitFunc(path).slice(-1)
    return label
  }

  abstract filterChildren(path?: string): T[]
}
