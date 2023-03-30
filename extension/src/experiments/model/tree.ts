import {
  commands,
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri
} from 'vscode'
import { ExperimentType } from '.'
import { collectDeletable, ExperimentItem } from './collect'
import { MAX_SELECTED_EXPERIMENTS } from './status'
import { getDataFromColumnPaths } from './util'
import { WorkspaceExperiments } from '../workspace'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { definedAndNonEmpty, sortCollectedArray } from '../../util/array'
import {
  createTreeView,
  DecoratableTreeItemScheme,
  getDecoratableTreeItem,
  getErrorTooltip,
  getRootItem
} from '../../tree'
import { IconName, Resource, ResourceLocator } from '../../resourceLocator'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { sum } from '../../util/math'
import { Disposable } from '../../class/dispose'
import { Experiment, ExperimentStatus, isRunning } from '../webview/contract'
import { getMarkdownString } from '../../vscode/markdownString'
import { truncateFromLeft } from '../../util/string'

export type ExperimentAugmented = Experiment & {
  hasChildren: boolean
  selected?: boolean
  starred: boolean
  type: ExperimentType
}

export class ExperimentsTree
  extends Disposable
  implements TreeDataProvider<string | ExperimentItem>
{
  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: WorkspaceExperiments
  private readonly resourceLocator: ResourceLocator

  private readonly view: TreeView<string | ExperimentItem>
  private viewed = false

  constructor(
    experiments: WorkspaceExperiments,
    resourceLocator: ResourceLocator
  ) {
    super()

    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.view = this.dispose.track(
      createTreeView<ExperimentItem>('dvc.views.experimentsTree', this, true)
    )

    this.experiments = experiments
    this.resourceLocator = resourceLocator

    this.registerWorkaroundCommand()

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | ExperimentItem): TreeItem {
    if (this.isRoot(element)) {
      return getRootItem(element)
    }

    const {
      label,
      collapsibleState,
      iconPath,
      command,
      description,
      type,
      tooltip
    } = element
    const item = getDecoratableTreeItem(
      label,
      DecoratableTreeItemScheme.EXPERIMENTS,
      collapsibleState
    )
    if (iconPath) {
      item.iconPath = iconPath
    }
    item.description = description
    item.contextValue = type
    if (tooltip) {
      item.tooltip = tooltip
    }
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
      return Promise.resolve(this.getWorkspaceAndCommits(element))
    }

    return Promise.resolve(
      this.getExperimentsByCommit(element.dvcRoot, element)
    )
  }

  private registerWorkaroundCommand() {
    commands.registerCommand(
      'dvc.views.experimentsTree.removeExperiment',
      async experimentItem => {
        const selected = [
          ...this.getSelectedExperimentItems(),
          experimentItem
        ] as (string | ExperimentItem)[]

        const deletable = collectDeletable(selected)

        for (const [dvcRoot, ids] of Object.entries(deletable)) {
          await commands.executeCommand(
            RegisteredCliCommands.EXPERIMENT_VIEW_REMOVE,
            { dvcRoot, ids }
          )
        }
      }
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
      this.experiments.getRepository(dvcRoot).getWorkspaceAndCommits()
    )
    if (definedAndNonEmpty(experiments)) {
      if (dvcRoots.length === 1) {
        const [onlyRepo] = dvcRoots
        return this.getChildren(onlyRepo)
      }

      return sortCollectedArray(dvcRoots, (a, b) => a.localeCompare(b))
    }

    return []
  }

  private formatExperiment(experiment: ExperimentAugmented, dvcRoot: string) {
    return {
      collapsibleState: experiment.hasChildren
        ? TreeItemCollapsibleState.Expanded
        : TreeItemCollapsibleState.None,
      command: {
        arguments: [{ dvcRoot, id: experiment.id }],
        command: RegisteredCommands.EXPERIMENT_TOGGLE,
        title: 'toggle'
      },
      description: experiment.displayNameOrParent,
      dvcRoot,
      iconPath: this.getExperimentIcon(experiment),
      id: experiment.id,
      label: experiment.label,
      tooltip: this.getTooltip(
        experiment.error,
        experiment,
        this.experiments.getRepository(dvcRoot).getFirstThreeColumnOrder()
      ),
      type: experiment.type
    }
  }

  private getWorkspaceAndCommits(dvcRoot: string): ExperimentItem[] {
    return this.experiments
      .getRepository(dvcRoot)
      .getWorkspaceAndCommits()
      .map(experiment => this.formatExperiment(experiment, dvcRoot))
  }

  private getExperimentsByCommit(
    dvcRoot: string,
    commit: Experiment
  ): ExperimentItem[] {
    return (
      this.experiments
        .getRepository(dvcRoot)
        .getCommitExperiments(commit)
        ?.map(experiment =>
          this.formatExperiment(experiment as ExperimentAugmented, dvcRoot)
        ) || []
    )
  }

  private getExperimentIcon({
    displayColor,
    status,
    type,
    selected
  }: {
    displayColor?: string
    label: string
    status?: ExperimentStatus
    type?: ExperimentType
    selected?: boolean
  }): ThemeIcon | Uri | Resource {
    if (isRunning(status)) {
      return this.getUriOrIcon(displayColor, IconName.LOADING_SPIN)
    }
    if (type === ExperimentType.QUEUED) {
      return this.resourceLocator.clock
    }

    const iconName = this.getIconName(selected)

    return this.getUriOrIcon(displayColor, iconName)
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

    const total = sum(
      dvcRoots.map(dvcRoot =>
        this.experiments.getRepository(dvcRoot).getExperimentCount()
      )
    )

    if (!total) {
      return
    }

    const selected = sum(
      dvcRoots.map(
        dvcRoot =>
          this.experiments.getRepository(dvcRoot).getSelectedRevisions().length
      )
    )

    return (
      `${selected} of ${total} (max ${MAX_SELECTED_EXPERIMENTS}` +
      (dvcRoots.length > 1 ? ' per project' : '') +
      ')'
    )
  }

  private isRoot(element: string | ExperimentItem): element is string {
    return typeof element === 'string'
  }

  private getSelectedExperimentItems() {
    return [...this.view.selection]
  }

  private getTooltipTable(experiment: Experiment, firstThreeColumns: string[]) {
    const data = getDataFromColumnPaths(experiment, firstThreeColumns)
      .map(
        ({ truncatedValue: value, columnPath }) =>
          `| ${truncateFromLeft(columnPath, 30)} | ${value} |\n`
      )
      .join('')
    return data === '' ? undefined : getMarkdownString(`|||\n|:--|--|\n${data}`)
  }

  private getTooltip(
    error: string | undefined,
    experiment: Experiment,
    firstThreeColumns: string[]
  ) {
    if (!error) {
      if (firstThreeColumns.length === 0) {
        return
      }

      return this.getTooltipTable(experiment, firstThreeColumns)
    }

    return getErrorTooltip(error)
  }
}
