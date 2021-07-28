import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri,
  window
} from 'vscode'
import { Experiments } from '..'
import { definedAndNonEmpty, flatten, joinTruthyItems } from '../../util/array'
import { Status } from '../model'

export class ExperimentsTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments
  private runRoots: Record<string, string> = {}

  private view: TreeView<string>

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.view = this.dispose.track(
      window.createTreeView('dvc.views.experimentsTree', {
        canSelectMany: true,
        showCollapseAll: true,
        treeDataProvider: this
      })
    )

    this.experiments = experiments

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string): TreeItem {
    if (this.isRoot(element)) {
      return new TreeItem(Uri.file(element), TreeItemCollapsibleState.Collapsed)
    }

    return this.getExperimentTreeItem(element)
  }

  public getChildren(element?: string): Promise<string[]> {
    if (!element) {
      return this.getRootElements()
    }

    if (this.isRoot(element)) {
      return Promise.resolve(this.getExperimentNames(element))
    }

    return Promise.resolve(
      this.experiments.getCheckpointNames(this.runRoots[element], element) || []
    )
  }

  private getExperimentTreeItem(element: string) {
    const dvcRoot = this.runRoots[element]
    if (!dvcRoot) {
      return this.getRunningCheckpoint(element)
    }

    const experiment = this.experiments.getExperiment(dvcRoot, element)

    if (element === 'workspace' || experiment?.running) {
      return this.getRunning(element, experiment?.hasChildren)
    }

    if (experiment?.queued) {
      return this.getQueued(element)
    }

    return this.getExistingExperiment(element, experiment?.hasChildren)
  }

  private getRunningCheckpoint(element: string) {
    return this.getTreeItemWithIcon(
      element,
      TreeItemCollapsibleState.None,
      'debug-stackframe-dot'
    )
  }

  private getRunning(element: string, hasChildren?: boolean) {
    const collapsibleState = hasChildren
      ? TreeItemCollapsibleState.Collapsed
      : TreeItemCollapsibleState.None

    return this.getTreeItemWithIcon(element, collapsibleState, 'loading~spin')
  }

  private getQueued(element: string) {
    return this.getTreeItemWithIcon(
      element,
      TreeItemCollapsibleState.None,
      'watch'
    )
  }

  private getExistingExperiment(element: string, hasChildren?: boolean) {
    return this.getTreeItemWithIcon(
      element,
      hasChildren
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None,
      'primitive-dot'
    )
  }

  private getTreeItemWithIcon(
    element: string,
    collapsibleState: TreeItemCollapsibleState,
    iconId: string
  ) {
    const item = new TreeItem(element, collapsibleState)
    item.iconPath = new ThemeIcon(iconId)
    return item
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()
    const experimentNames = flatten(
      dvcRoots.map(dvcRoot => {
        this.runRoots[dvcRoot] = dvcRoot
        return this.experiments.getExperimentNames(dvcRoot)
      })
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

  private getExperimentNames(dvcRoot: string): string[] {
    const experimentNames = this.experiments.getExperimentNames(dvcRoot)
    experimentNames.forEach(name => (this.runRoots[name] = dvcRoot))
    return experimentNames
  }

  private isRoot(element: string) {
    return Object.values(this.runRoots).includes(element)
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
}
