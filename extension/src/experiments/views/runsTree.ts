import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeColor,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window
} from 'vscode'
import { Experiments } from '..'
import { definedAndNonEmpty, flatten } from '../../util/array'

export class ExperimentsRunsTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments
  private runRoots: Record<string, string> = {}

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsRowsChanged.event

    this.dispose.track(
      window.createTreeView('dvc.views.experimentsRunsTree', {
        canSelectMany: true,
        showCollapseAll: true,
        treeDataProvider: this
      })
    )

    this.experiments = experiments
  }

  public getTreeItem(element: string): TreeItem {
    if (this.isRoot(element)) {
      return new TreeItem(Uri.file(element), TreeItemCollapsibleState.Collapsed)
    }

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

  private getRunningCheckpoint(element: string) {
    return this.getTreeItemWithIcon(
      element,
      TreeItemCollapsibleState.None,
      'primitive-dot'
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
    const item = new TreeItem(
      element,
      hasChildren
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )
    item.iconPath = new ThemeIcon(
      'primitive-dot',
      new ThemeColor('textLink.activeForeground')
    )
    return item
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
    const runningOrQueued = flatten(
      dvcRoots.map(dvcRoot => {
        this.runRoots[dvcRoot] = dvcRoot
        return this.experiments.getExperimentNames(dvcRoot)
      })
    )
    if (definedAndNonEmpty(runningOrQueued)) {
      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private getExperimentNames(dvcRoot: string): string[] {
    const runningOrQueued = this.experiments.getExperimentNames(dvcRoot)
    runningOrQueued.forEach(name => (this.runRoots[name] = dvcRoot))
    return runningOrQueued
  }

  private isRoot(element: string) {
    return Object.values(this.runRoots).includes(element)
  }
}
