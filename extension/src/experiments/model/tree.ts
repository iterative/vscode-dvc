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
import { WorkspaceExperiments } from '../workspace'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { definedAndNonEmpty, flatten, joinTruthyItems } from '../../util/array'
import { createTreeView, getRootItem } from '../../vscode/tree'
import { IconName, Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'

enum Status {
  RUNNING = 1,
  QUEUED = 2
}

export type ExperimentItem = {
  command?: {
    arguments: { dvcRoot: string; id: string }[]
    command: RegisteredCommands
    title: string
  }
  dvcRoot: string
  description: string | undefined
  id: string
  label: string
  collapsibleState: TreeItemCollapsibleState
  iconPath: ThemeIcon | Uri | Resource
}

export class ExperimentsTree
  implements TreeDataProvider<string | ExperimentItem>
{
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: WorkspaceExperiments
  private readonly resourceLocator: ResourceLocator

  private readonly view: TreeView<string | ExperimentItem>
  private viewed = false

  private expandedExperiments: Record<string, boolean | undefined> = {}

  constructor(
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.view = this.dispose.track(
      createTreeView<ExperimentItem>('dvc.views.experimentsTree', this)
    )

    this.dispose.track(
      this.view.onDidCollapseElement(({ element }) => {
        this.setExpanded(element, false)
      })
    )

    this.dispose.track(
      this.view.onDidExpandElement(({ element }) => {
        this.setExpanded(element, true)
      })
    )

    this.experiments = experiments
    this.resourceLocator = resourceLocator

    internalCommands.registerExternalCommand<ExperimentItem>(
      RegisteredCommands.EXPERIMENT_TOGGLE,
      ({ dvcRoot, id }) =>
        this.experiments.getRepository(dvcRoot).toggleExperimentStatus(id)
    )

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | ExperimentItem): TreeItem {
    if (this.isRoot(element)) {
      return getRootItem(element)
    }

    const { label, collapsibleState, iconPath, command, description } = element
    const item = new TreeItem(label, collapsibleState)
    item.iconPath = iconPath
    item.description = description
    if (command) {
      item.command = command
    }
    return item
  }

  public getChildren(
    element?: string | ExperimentItem
  ): Promise<string[] | ExperimentItem[]> {
    if (!element) {
      return this.getRootElements()
    }

    if (this.isRoot(element)) {
      return Promise.resolve(this.getExperiments(element))
    }

    const { dvcRoot, id } = element
    return Promise.resolve(this.getCheckpoints(dvcRoot, id))
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()

    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_TREE_OPENED,
        dvcRoots.length
      )
      this.viewed = true
    }

    const experiments = flatten(
      dvcRoots.map(dvcRoot =>
        this.experiments.getRepository(dvcRoot).getExperiments()
      )
    )
    if (definedAndNonEmpty(experiments)) {
      if (dvcRoots.length === 1) {
        const [onlyRepo] = dvcRoots
        return this.getChildren(onlyRepo)
      }
      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private getExperiments(dvcRoot: string): ExperimentItem[] {
    return this.experiments
      .getRepository(dvcRoot)
      .getExperiments()
      .map(experiment => ({
        collapsibleState: experiment.hasChildren
          ? this.getCollapsibleState(experiment.displayNameOrParent)
          : TreeItemCollapsibleState.None,
        command: experiment.queued
          ? undefined
          : {
              arguments: [{ dvcRoot, id: experiment.id }],
              command: RegisteredCommands.EXPERIMENT_TOGGLE,
              title: 'toggle'
            },
        description: experiment.displayNameOrParent,
        dvcRoot,
        iconPath: this.getExperimentIcon(experiment),
        id: experiment.id,
        label: experiment.label
      }))
  }

  private setExpanded(element: string | ExperimentItem, expanded: boolean) {
    if (!this.isRoot(element) && element.description) {
      this.setExperimentExpanded(element.description, expanded)
    }
  }

  private setExperimentExpanded(description: string, expanded: boolean) {
    this.expandedExperiments[description] = expanded
  }

  private getCollapsibleState(description?: string) {
    if (description && this.expandedExperiments[description]) {
      return TreeItemCollapsibleState.Expanded
    }
    return TreeItemCollapsibleState.Collapsed
  }

  private getExperimentIcon({
    displayColor,
    running,
    queued,
    selected
  }: {
    displayColor?: string
    label: string
    running?: boolean
    queued?: boolean
    selected?: boolean
  }): ThemeIcon | Uri | Resource {
    if (running) {
      return this.getUriOrIcon(displayColor, IconName.LOADING_SPIN)
    }
    if (queued) {
      return this.resourceLocator.clock
    }

    const iconName = this.getIconName(selected)

    return this.getUriOrIcon(displayColor, iconName)
  }

  private getCheckpoints(dvcRoot: string, id: string): ExperimentItem[] {
    return (
      this.experiments.getRepository(dvcRoot).getCheckpoints(id) || []
    ).map(checkpoint => ({
      collapsibleState: TreeItemCollapsibleState.None,
      description: checkpoint.displayNameOrParent,
      dvcRoot,
      iconPath: this.getUriOrIcon(
        checkpoint.displayColor,
        this.getIconName(checkpoint.selected)
      ),
      id: checkpoint.id,
      label: checkpoint.label
    }))
  }

  private getUriOrIcon(displayColor: string | undefined, iconName: IconName) {
    if (displayColor) {
      return this.resourceLocator.getExperimentsResource(iconName, displayColor)
    }
    return new ThemeIcon(iconName.replace('-spin', '~spin'))
  }

  private getIconName(selected?: boolean) {
    return selected === false ? IconName.CIRCLE_OUTLINE : IconName.CIRCLE_FILLED
  }

  private updateDescriptionOnChange() {
    this.dispose.track(
      this.onDidChangeTreeData(() => {
        const statuses = this.getStatuses()
        this.view.description = this.getDescription(statuses)
      })
    )
  }

  private getStatuses() {
    const dvcRoots = this.experiments.getDvcRoots()

    return flatten<Status>(
      dvcRoots.map(dvcRoot =>
        this.experiments
          .getRepository(dvcRoot)
          .getExperiments()
          .filter(experiment => experiment.running || experiment.queued)
          .map(experiment =>
            experiment.running ? Status.RUNNING : Status.QUEUED
          )
      )
    )
  }

  private getDescription(statuses: Status[]) {
    if (!definedAndNonEmpty(statuses)) {
      return
    }

    const { active, queued } = statuses.reduce(
      (acc, status) => {
        if (status === Status.RUNNING) {
          acc.active += 1
        }

        if (status === Status.QUEUED) {
          acc.queued += 1
        }

        return acc
      },
      { active: 0, queued: 0 }
    )
    return joinTruthyItems(
      [
        this.getSubDescription(active, 'active'),
        this.getSubDescription(queued, 'queued')
      ],
      ', '
    )
  }

  private getSubDescription(count: number, label: string) {
    return count ? `${count} ${label}` : ''
  }

  private isRoot(element: string | ExperimentItem): element is string {
    return typeof element === 'string'
  }
}
