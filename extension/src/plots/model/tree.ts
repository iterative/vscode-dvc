import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri
} from 'vscode'
import { WorkspacePlots } from '../workspace'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { createTreeView, getRootItem } from '../../vscode/tree'
import { IconName, Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'

export enum Status {
  SELECTED = 1,
  UNSELECTED = 0
}

export type RevisionItem = {
  command?: {
    arguments: [{ dvcRoot: string; id: string }]
    command: RegisteredCommands
    title: string
  }
  dvcRoot: string
  id: string
  label: string
  collapsibleState: TreeItemCollapsibleState
  iconPath: ThemeIcon | Uri | Resource
}

export class PlotsTree implements TreeDataProvider<string | RevisionItem> {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly plots: WorkspacePlots
  private readonly resourceLocator: ResourceLocator

  private readonly view: TreeView<string | RevisionItem>
  private viewed = false

  constructor(
    plots: WorkspacePlots,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.onDidChangeTreeData = plots.plotsChanged.event

    this.view = this.dispose.track(
      createTreeView<RevisionItem>('dvc.views.plotsTree', this)
    )

    this.plots = plots
    this.resourceLocator = resourceLocator

    internalCommands.registerExternalCommand<RevisionItem>(
      RegisteredCommands.REVISION_TOGGLE,
      ({ dvcRoot, id }) => {
        return this.plots.getRepository(dvcRoot).toggleRevisionStatus(id)
      }
    )

    this.plots.isReady().then(() => this.updateDescription())

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | RevisionItem): TreeItem {
    if (this.isRoot(element)) {
      return getRootItem(element)
    }

    const { label, collapsibleState, iconPath, command } = element
    const item = new TreeItem(label, collapsibleState)
    item.iconPath = iconPath
    if (command) {
      item.command = command
    }
    return item
  }

  public getChildren(
    element?: string | RevisionItem
  ): Promise<string[] | RevisionItem[]> {
    if (!element) {
      return this.getRootElements()
    }

    if (this.isRoot(element)) {
      return Promise.resolve(this.getRevisions(element))
    }

    const { dvcRoot, id } = element
    return Promise.resolve(this.getChildRevisions(dvcRoot, id))
  }

  private async getRootElements() {
    await this.plots.isReady()
    const dvcRoots = this.plots.getDvcRoots()

    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_TREE_OPENED,
        dvcRoots.length
      )
      this.viewed = true
    }

    const revisionNames = flatten(
      dvcRoots.map(
        dvcRoot => this.plots.getRepository(dvcRoot).getRevisions() || []
      )
    )
    if (definedAndNonEmpty(revisionNames)) {
      if (dvcRoots.length === 1) {
        const [onlyRepo] = dvcRoots
        return this.getChildren(onlyRepo)
      }
      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private getRevisions(dvcRoot: string): RevisionItem[] {
    return this.plots
      .getRepository(dvcRoot)
      .getRevisions()
      .map(({ displayColor, id, name, status, hasChildren }) => ({
        collapsibleState: hasChildren
          ? TreeItemCollapsibleState.Collapsed
          : TreeItemCollapsibleState.None,
        command: {
          arguments: [{ dvcRoot, id: name || id }],
          command: RegisteredCommands.REVISION_TOGGLE,
          title: 'toggle'
        },
        dvcRoot,
        iconPath: this.getIconUri(status, displayColor),
        id,
        label: id
      }))
  }

  private getChildRevisions(dvcRoot: string, id: string): RevisionItem[] {
    return this.plots
      .getRepository(dvcRoot)
      .getChildRevisions(id)
      .map(({ displayColor, id, status }) => ({
        collapsibleState: TreeItemCollapsibleState.None,
        command: {
          arguments: [{ dvcRoot, id }],
          command: RegisteredCommands.REVISION_TOGGLE,
          title: 'toggle'
        },
        dvcRoot,
        iconPath: this.getIconUri(status, displayColor),
        id,
        label: id
      }))
  }

  private isRoot(element: string | RevisionItem): element is string {
    return typeof element === 'string'
  }

  private getIconUri(status: Status, displayColor: string) {
    const iconName =
      status === Status.SELECTED
        ? IconName.CIRCLE_FILLED
        : IconName.CIRCLE_OUTLINE

    return this.resourceLocator.getExperimentsResource(iconName, displayColor)
  }

  private updateDescriptionOnChange() {
    this.dispose.track(
      this.onDidChangeTreeData(() => {
        this.updateDescription()
      })
    )
  }

  private updateDescription() {
    const selectedCounts = this.getSelectedCounts()
    this.view.description = `${selectedCounts.reduce((a, b) => a + b, 0)} of ${
      selectedCounts.length * 6
    } Selected`
  }

  private getSelectedCounts() {
    const dvcRoots = this.plots.getDvcRoots()

    return dvcRoots.map(dvcRoot =>
      this.plots.getRepository(dvcRoot).getSelectedCount()
    )
  }
}
