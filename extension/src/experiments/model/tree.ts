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
import { ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { InternalCommands } from '../../commands/internal'

enum Status {
  RUNNING = 1,
  QUEUED = 2
}

export enum Type {
  CHECKPOINT = 'checkpoint',
  EXPERIMENT = 'experiment',
  QUEUED = 'queued'
}

type ExperimentItem = {
  dvcRoot: string
  id: string
  label: string
  collapsibleState: TreeItemCollapsibleState
  iconPath: ThemeIcon | Uri
  type: Type
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
        this.experiments.getRepository(dvcRoot).toggleExperiment(id)
    )

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | ExperimentItem): TreeItem {
    if (this.isRoot(element)) {
      return new TreeItem(Uri.file(element), TreeItemCollapsibleState.Collapsed)
    }

    const { label, collapsibleState, iconPath, id, dvcRoot, type } = element
    const item = new TreeItem(label, collapsibleState)
    item.iconPath = iconPath
    if (type === 'experiment') {
      item.command = {
        arguments: [{ dvcRoot, id }],
        command: RegisteredCommands.EXPERIMENT_TOGGLE,
        title: 'toggle'
      }
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
        dvcRoot,
        iconPath: this.getExperimentIcon(experiment),
        id: experiment.id,
        label: experiment.displayName,
        type: experiment.queued ? Type.QUEUED : Type.EXPERIMENT
      }))
  }

  private getExperimentIcon({
    displayName,
    running,
    queued,
    displayColor
  }: {
    displayColor?: string
    displayName: string
    running?: boolean
    queued?: boolean
  }): ThemeIcon | Uri {
    if (displayName === 'workspace' || running) {
      return this.getUriOrIcon(displayColor, 'loading-spin')
    }

    if (queued) {
      return new ThemeIcon('watch')
    }

    return this.getUriOrIcon(displayColor, 'circle-filled')
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
        'debug-stackframe-dot'
      ),
      id: checkpoint.id,
      label: checkpoint.displayName,
      type: Type.CHECKPOINT
    }))
  }

  private getUriOrIcon(
    displayColor: string | undefined,
    iconName: 'circle-filled' | 'debug-stackframe-dot' | 'loading-spin'
  ) {
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
