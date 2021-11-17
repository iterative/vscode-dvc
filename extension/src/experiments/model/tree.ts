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
import { createTreeView } from '../../vscode/tree'
import { IconName, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'

enum Status {
  RUNNING = 1,
  QUEUED = 2
}

type ExperimentItem = {
  command?: {
    arguments: [{ dvcRoot: string; id: string }]
    command: RegisteredCommands
    title: string
  }
  dvcRoot: string
  id: string
  label: string
  collapsibleState: TreeItemCollapsibleState
  iconPath: ThemeIcon | Uri
}

export class ExperimentsTree
  implements TreeDataProvider<string | ExperimentItem>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: WorkspaceExperiments
  private readonly resourceLocator: ResourceLocator

  private view: TreeView<string | ExperimentItem>
  private viewed = false

  constructor(
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.view = this.dispose.track(
      createTreeView<ExperimentItem>('dvc.views.experimentsTree', this)
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
      return new TreeItem(Uri.file(element), TreeItemCollapsibleState.Collapsed)
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

    const experimentNames = flatten(
      dvcRoots.map(dvcRoot =>
        this.experiments.getRepository(dvcRoot).getExperiments()
      )
    )
    if (definedAndNonEmpty(experimentNames)) {
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
          ? TreeItemCollapsibleState.Collapsed
          : TreeItemCollapsibleState.None,
        command: experiment.queued
          ? undefined
          : {
              arguments: [{ dvcRoot, id: experiment.id }],
              command: RegisteredCommands.EXPERIMENT_TOGGLE,
              title: 'toggle'
            },
        dvcRoot,
        iconPath: this.getExperimentIcon(experiment),
        id: experiment.id,
        label: experiment.displayName
      }))
  }

  private getExperimentIcon({
    displayColor,
    displayName,
    running,
    queued,
    selected
  }: {
    displayColor?: string
    displayName: string
    running?: boolean
    queued?: boolean
    selected?: boolean
  }): ThemeIcon | Uri {
    if (displayName === 'workspace' || running) {
      return this.getUriOrIcon(displayColor, IconName.LOADING_SPIN)
    }

    if (queued) {
      return new ThemeIcon('watch')
    }

    const iconName =
      selected === false ? IconName.CIRCLE_OUTLINE : IconName.CIRCLE_FILLED

    return this.getUriOrIcon(displayColor, iconName)
  }

  private getCheckpoints(
    dvcRoot: string,
    experimentId: string
  ): ExperimentItem[] {
    return (
      this.experiments.getRepository(dvcRoot).getCheckpoints(experimentId) || []
    ).map(checkpoint => ({
      collapsibleState: TreeItemCollapsibleState.None,
      dvcRoot,
      iconPath: this.getUriOrIcon(
        checkpoint.displayColor,
        IconName.DEBUG_STACKFRAME_DOT
      ),
      id: checkpoint.id,
      label: checkpoint.displayName
    }))
  }

  private getUriOrIcon(displayColor: string | undefined, iconName: IconName) {
    if (displayColor) {
      return this.resourceLocator.getExperimentsResource(iconName, displayColor)
    }
    return new ThemeIcon(iconName.replace('-spin', '~spin'))
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
