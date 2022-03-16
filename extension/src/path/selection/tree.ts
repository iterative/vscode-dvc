import {
  Event,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Status } from './model'
import { WorkspaceExperiments } from '../../experiments/workspace'
import { WorkspacePlots } from '../../plots/workspace'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { createTreeView } from '../../vscode/tree'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { ViewOpenedEventName } from '../../telemetry/constants'

export type PathSelectionItem = {
  description: string | undefined
  dvcRoot: string
  collapsibleState: TreeItemCollapsibleState
  label: string
  path: string
  iconPath: Resource
}

export abstract class BasePathSelectionTree<
  T extends WorkspaceExperiments | WorkspacePlots
> implements TreeDataProvider<string | PathSelectionItem>
{
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<PathSelectionItem | void>

  protected readonly workspace: T

  private readonly resourceLocator: ResourceLocator

  private readonly view: TreeView<string | PathSelectionItem>

  private viewed = false
  private readonly openEventName: ViewOpenedEventName

  private readonly toggleCommand: RegisteredCommands

  constructor(
    workspace: T,
    resourceLocator: ResourceLocator,
    name: string,
    changeEvent: Event<PathSelectionItem | void>,
    toggleCommand: RegisteredCommands,
    openEventName: ViewOpenedEventName
  ) {
    this.workspace = workspace
    this.resourceLocator = resourceLocator

    this.onDidChangeTreeData = changeEvent

    this.view = this.dispose.track(
      createTreeView<PathSelectionItem>(name, this)
    )

    this.toggleCommand = toggleCommand

    this.openEventName = openEventName

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | PathSelectionItem): TreeItem {
    if (this.isRoot(element)) {
      const resourceUri = Uri.file(element)
      return new TreeItem(resourceUri, TreeItemCollapsibleState.Collapsed)
    }

    const { dvcRoot, path, label, collapsibleState, description, iconPath } =
      element

    const treeItem = new TreeItem(label, collapsibleState)

    treeItem.command = {
      arguments: [{ dvcRoot, path }],
      command: this.toggleCommand,
      title: 'toggle'
    }

    treeItem.iconPath = iconPath
    if (description) {
      treeItem.description = description
    }

    return treeItem
  }

  public getChildren(
    element?: string | PathSelectionItem
  ): Promise<PathSelectionItem[] | string[]> {
    if (element) {
      return Promise.resolve(this.getChildElements(element))
    }

    return this.getRootElements()
  }

  protected getIconPath(status?: Status) {
    if (status === Status.SELECTED) {
      return this.resourceLocator.checkedCheckbox
    }
    if (status === Status.INDETERMINATE) {
      return this.resourceLocator.indeterminateCheckbox
    }
    return this.resourceLocator.emptyCheckbox
  }

  protected getDescription(statuses: Status[], separator: string) {
    if (!definedAndNonEmpty(statuses)) {
      return
    }
    return `${
      statuses.filter(status =>
        [Status.SELECTED, Status.INDETERMINATE].includes(status)
      ).length
    }${separator}${statuses.length}`
  }

  private updateDescriptionOnChange() {
    this.dispose.track(
      this.onDidChangeTreeData(() => {
        const dvcRoots = this.workspace.getDvcRoots()
        const statuses = flatten<Status>(
          dvcRoots.map(dvcRoot => this.getRepositoryStatuses(dvcRoot))
        )
        this.view.description = this.getDescription(statuses, ' of ')
      })
    )
  }

  private async getRootElements() {
    await this.workspace.isReady()
    const dvcRoots = this.workspace.getDvcRoots()

    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(this.openEventName, dvcRoots.length)
      this.viewed = true
    }

    if (dvcRoots.length === 1) {
      const [onlyRepo] = dvcRoots
      return this.getChildren(onlyRepo)
    }

    return dvcRoots.sort((a, b) => a.localeCompare(b))
  }

  private getChildElements(
    element: string | PathSelectionItem
  ): PathSelectionItem[] {
    if (!element) {
      return []
    }

    if (this.isRoot(element)) {
      return this.transformRepositoryChildren(element, undefined)
    }

    const { dvcRoot, path } = element

    return this.transformRepositoryChildren(dvcRoot, path)
  }

  private isRoot(element: string | PathSelectionItem): element is string {
    return typeof element === 'string'
  }

  private transformRepositoryChildren(
    dvcRoot: string,
    path: string | undefined
  ) {
    return this.getRepositoryChildren(dvcRoot, path).map(element => {
      const { descendantStatuses, hasChildren, path, status, label } = element

      const description = this.getDescription(descendantStatuses, '/')
      const iconPath = this.getIconPath(status)
      const collapsibleState = hasChildren
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None

      return {
        collapsibleState,
        description,
        dvcRoot,
        iconPath,
        label,
        path
      } as PathSelectionItem
    })
  }

  abstract getRepositoryStatuses(dvcRoot: string): Status[]

  abstract getRepositoryChildren(
    dvcRoot: string,
    path: string | undefined
  ): {
    descendantStatuses: Status[]
    hasChildren: boolean
    label: string
    path: string
    status: Status
  }[]
}
