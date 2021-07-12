import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  EventEmitter,
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
  private treeDataChanged: EventEmitter<string | void>

  private readonly experiments: Experiments
  private runRoots: Record<string, string> = {}

  constructor(
    experiments: Experiments,
    treeDataChanged?: EventEmitter<string | void>
  ) {
    this.treeDataChanged = this.dispose.track(
      treeDataChanged || new EventEmitter()
    )
    this.onDidChangeTreeData = this.treeDataChanged.event

    this.dispose.track(
      window.createTreeView('dvc.views.experimentsRunsTree', {
        canSelectMany: true,
        showCollapseAll: true,
        treeDataProvider: this
      })
    )

    this.experiments = experiments
    this.dispose.track(
      experiments.onDidRunsOrQueuedChange(() => this.treeDataChanged.fire())
    )
  }

  public getTreeItem(element: string): TreeItem {
    if (this.isRoot(element)) {
      return new TreeItem(Uri.file(element), TreeItemCollapsibleState.Collapsed)
    }

    const item = new TreeItem(element, TreeItemCollapsibleState.None)
    item.iconPath = new ThemeIcon('watch')
    return item
  }

  public getChildren(element?: string): Promise<string[]> {
    if (element) {
      return Promise.resolve(this.getQueuedExperiments(element))
    }

    return this.getRootElements()
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()
    const queued = flatten(
      dvcRoots.map(dvcRoot => {
        this.runRoots[dvcRoot] = dvcRoot
        return this.experiments.getQueuedExperiments(dvcRoot)
      })
    )
    if (definedAndNonEmpty(queued)) {
      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private getQueuedExperiments(dvcRoot: string): string[] {
    const queued = this.experiments.getQueuedExperiments(dvcRoot)
    queued.forEach(experiment => (this.runRoots[experiment] = dvcRoot))
    return queued
  }

  private isRoot(element: string) {
    return Object.values(this.runRoots).includes(element)
  }
}
