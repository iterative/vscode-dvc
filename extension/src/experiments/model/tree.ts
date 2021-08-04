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
import { Experiments } from '..'
import { definedAndNonEmpty, flatten, joinTruthyItems } from '../../util/array'
import { createTreeView } from '../../vscode/tree'
import { Status } from '../model'

type ExperimentItem = {
  dvcRoot: string
  label: string
  collapsibleState: TreeItemCollapsibleState
  iconPath: ThemeIcon
}

export class ExperimentsTree
  implements TreeDataProvider<string | ExperimentItem>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments

  private view: TreeView<string | ExperimentItem>

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.view = this.dispose.track(
      createTreeView<ExperimentItem>('dvc.views.experimentsTree', this)
    )

    this.experiments = experiments

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | ExperimentItem): TreeItem {
    if (this.isRoot(element)) {
      return new TreeItem(Uri.file(element), TreeItemCollapsibleState.Collapsed)
    }

    const { label, collapsibleState, iconPath } = element
    const item = new TreeItem(label, collapsibleState)
    item.iconPath = iconPath
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

    const { dvcRoot, label } = element
    return Promise.resolve(this.getCheckpoints(dvcRoot, label) || [])
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()
    const experimentNames = flatten(
      dvcRoots.map(dvcRoot => this.experiments.getExperiments(dvcRoot))
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
    return this.experiments.getExperiments(dvcRoot).map(experiment => ({
      collapsibleState: experiment.hasChildren
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None,
      dvcRoot,
      iconPath: this.getExperimentThemeIcon(experiment),
      label: experiment.displayName
    }))
  }

  private getExperimentThemeIcon({
    displayName,
    running,
    queued
  }: {
    displayName: string
    running?: boolean
    queued?: boolean
  }): ThemeIcon {
    if (displayName === 'workspace' || running) {
      return new ThemeIcon('loading~spin')
    }

    if (queued) {
      return new ThemeIcon('watch')
    }

    return new ThemeIcon('primitive-dot')
  }

  private getCheckpoints(dvcRoot: string, name: string) {
    return (this.experiments.getCheckpoints(dvcRoot, name) || []).map(
      checkpoint => ({
        collapsibleState: TreeItemCollapsibleState.None,
        dvcRoot,
        iconPath: new ThemeIcon('debug-stackframe-dot'),
        label: checkpoint.displayName
      })
    )
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
      dvcRoots.map(dvcRoot => this.experiments.getExperimentStatuses(dvcRoot))
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
