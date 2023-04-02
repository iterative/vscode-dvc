import {
  Event,
  MarkdownString,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri
} from 'vscode'
import { Status } from './model'
import { WorkspaceExperiments } from '../../experiments/workspace'
import { WorkspacePlots } from '../../plots/workspace'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { createTreeView, isRoot } from '../../tree'
import { definedAndNonEmpty, sortCollectedArray } from '../../util/array'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { ViewOpenedEventName } from '../../telemetry/constants'
import { Disposable } from '../../class/dispose'

export type ErrorItem = { error: string; path: string }

export type PathSelectionItem = {
  collapsibleState: TreeItemCollapsibleState
  description: string | undefined
  dvcRoot: string
  iconPath: Resource | Uri
  label: string | undefined
  path: string
  tooltip: MarkdownString | undefined
}

type Item = ErrorItem | PathSelectionItem

export abstract class BasePathSelectionTree<
    T extends WorkspaceExperiments | WorkspacePlots
  >
  extends Disposable
  implements TreeDataProvider<string | Item>
{
  public readonly onDidChangeTreeData: Event<PathSelectionItem | void>

  protected readonly workspace: T
  protected readonly resourceLocator: ResourceLocator

  private readonly view: TreeView<string | Item>

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
    super()

    this.workspace = workspace
    this.resourceLocator = resourceLocator

    this.onDidChangeTreeData = changeEvent

    this.view = this.dispose.track(createTreeView<Item>(name, this))

    this.toggleCommand = toggleCommand

    this.openEventName = openEventName

    this.updateDescriptionOnChange()
  }

  public getChildren(
    element?: string | PathSelectionItem
  ): Promise<Item[] | string[]> {
    if (element) {
      return Promise.resolve(this.getChildElements(element))
    }

    return this.getRootElements()
  }

  protected getIconPath(status: Status) {
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

  protected transformElement(element: {
    dvcRoot: string
    descendantStatuses: Status[]
    hasChildren: boolean
    path: string
    status: Status
    label?: string
    tooltip?: MarkdownString
  }) {
    const {
      dvcRoot,
      descendantStatuses,
      hasChildren,
      path,
      status,
      label,
      tooltip
    } = element

    const description = this.getDescription(descendantStatuses, '/')
    const iconPath = this.getIconPath(status)
    const collapsibleState = hasChildren
      ? TreeItemCollapsibleState.Collapsed
      : TreeItemCollapsibleState.None

    const pathSelectionItem: PathSelectionItem = {
      collapsibleState,
      description,
      dvcRoot,
      iconPath,
      label,
      path,
      tooltip
    }

    return pathSelectionItem
  }

  protected addTreeItemDetails(element: PathSelectionItem, treeItem: TreeItem) {
    const { dvcRoot, path, description, iconPath, tooltip } = element

    treeItem.command = {
      arguments: [{ dvcRoot, path }],
      command: this.toggleCommand,
      title: 'toggle'
    }

    treeItem.iconPath = iconPath
    if (description) {
      treeItem.description = description
    }

    treeItem.tooltip = tooltip

    return treeItem
  }

  private updateDescriptionOnChange() {
    this.dispose.track(
      this.onDidChangeTreeData(() => {
        const dvcRoots = this.workspace.getDvcRoots()
        const statuses = dvcRoots.flatMap(dvcRoot =>
          this.getRepositoryStatuses(dvcRoot)
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

    return sortCollectedArray(dvcRoots, (a, b) => a.localeCompare(b))
  }

  private getChildElements(element: string | PathSelectionItem): Item[] {
    if (!element) {
      return []
    }

    if (isRoot(element)) {
      return this.getRepositoryChildren(element, undefined)
    }

    const { dvcRoot, path } = element

    return this.getRepositoryChildren(dvcRoot, path)
  }

  abstract getTreeItem(element: string | Item): TreeItem

  protected abstract getRepositoryChildren(
    dvcRoot: string,
    path: string | undefined
  ): Item[]

  protected abstract getRepositoryStatuses(dvcRoot: string): Status[]
}
