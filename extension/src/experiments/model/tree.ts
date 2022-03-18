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
import { ExperimentType } from '.'
import { MAX_SELECTED_EXPERIMENTS } from './status'
import { WorkspaceExperiments } from '../workspace'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { definedAndNonEmpty } from '../../util/array'
import { createTreeView, getRootItem } from '../../vscode/tree'
import { IconName, Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { sum } from '../../util/math'
import { Title } from '../../vscode/title'

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
  type: ExperimentType
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

    this.registerCommands(internalCommands)

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | ExperimentItem): TreeItem {
    if (this.isRoot(element)) {
      return getRootItem(element)
    }

    const { label, collapsibleState, iconPath, command, description, type } =
      element
    const item = new TreeItem(label, collapsibleState)
    item.iconPath = iconPath
    item.description = description
    item.contextValue = type
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

  private registerCommands(internalCommands: InternalCommands) {
    internalCommands.registerExternalCommand<ExperimentItem>(
      RegisteredCommands.EXPERIMENT_TOGGLE,
      ({ dvcRoot, id }) =>
        this.experiments.getRepository(dvcRoot).toggleExperimentStatus(id)
    )

    internalCommands.registerExternalCommand<ExperimentItem>(
      RegisteredCommands.EXPERIMENT_TREE_APPLY,
      ({ dvcRoot, id, label, type }: ExperimentItem) =>
        this.experiments.runCommand(
          AvailableCommands.EXPERIMENT_APPLY,
          dvcRoot,
          this.getDisplayId(type, label, id)
        )
    )

    internalCommands.registerExternalCommand<ExperimentItem>(
      RegisteredCommands.EXPERIMENT_TREE_BRANCH,
      ({ dvcRoot, id, label, type }: ExperimentItem) => {
        this.experiments.getInputAndRun(
          AvailableCommands.EXPERIMENT_BRANCH,
          dvcRoot,
          Title.ENTER_BRANCH_NAME,
          this.getDisplayId(type, label, id)
        )
      }
    )

    internalCommands.registerExternalCommand<ExperimentItem>(
      RegisteredCommands.EXPERIMENT_TREE_REMOVE,
      ({ dvcRoot, id }: ExperimentItem) =>
        this.experiments.runCommand(
          AvailableCommands.EXPERIMENT_REMOVE,
          dvcRoot,
          id
        )
    )
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

    const experiments = dvcRoots.flatMap(dvcRoot =>
      this.experiments.getRepository(dvcRoot).getExperiments()
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
        label: experiment.label,
        type: experiment.type
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
    type,
    selected
  }: {
    displayColor?: string
    label: string
    running?: boolean
    type?: ExperimentType
    selected?: boolean
  }): ThemeIcon | Uri | Resource {
    if (running) {
      return this.getUriOrIcon(displayColor, IconName.LOADING_SPIN)
    }
    if (type === ExperimentType.QUEUED) {
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
      command: {
        arguments: [{ dvcRoot, id: checkpoint.id }],
        command: RegisteredCommands.EXPERIMENT_TOGGLE,
        title: 'toggle'
      },
      description: checkpoint.displayNameOrParent,
      dvcRoot,
      iconPath: this.getUriOrIcon(
        checkpoint.displayColor,
        this.getIconName(checkpoint.selected)
      ),
      id: checkpoint.id,
      label: checkpoint.label,
      type: checkpoint.type
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
        this.view.description = this.getDescription()
      })
    )
  }

  private getDescription() {
    const dvcRoots = this.experiments.getDvcRoots()
    if (!definedAndNonEmpty(dvcRoots)) {
      return
    }

    const selected = sum(
      dvcRoots.map(
        dvcRoot =>
          this.experiments.getRepository(dvcRoot).getSelectedRevisions().length
      )
    )

    return `${selected} of ${dvcRoots.length * MAX_SELECTED_EXPERIMENTS}`
  }

  private isRoot(element: string | ExperimentItem): element is string {
    return typeof element === 'string'
  }

  private getDisplayId(type: ExperimentType, label: string, id: string) {
    return type === ExperimentType.CHECKPOINT ? label : id
  }
}
