import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window
} from 'vscode'
import { Experiments } from '..'

export class ExperimentsSortedByTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>
  private treeDataChanged: EventEmitter<string | void>

  private readonly experiments: Experiments
  private pathRoots: Record<string, string> = {}

  constructor(
    experiments: Experiments,
    treeDataChanged?: EventEmitter<string | void>
  ) {
    this.treeDataChanged = this.dispose.track(
      treeDataChanged || new EventEmitter()
    )
    this.onDidChangeTreeData = this.treeDataChanged.event

    this.dispose.track(
      window.createTreeView('dvc.views.experimentSortByTree', {
        canSelectMany: true,
        showCollapseAll: true,
        treeDataProvider: this
      })
    )

    this.experiments = experiments
  }

  public getTreeItem(element: string): TreeItem {
    return new TreeItem(Uri.file(element), TreeItemCollapsibleState.Collapsed)
  }

  public getChildren(element?: string): Promise<string[]> {
    if (element) {
      return Promise.resolve([''])
    }

    return this.getRootElements()
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots() || []
    dvcRoots.forEach(dvcRoot => {
      this.pathRoots[dvcRoot] = dvcRoot
    })

    return dvcRoots.sort((a, b) => a.localeCompare(b))
  }
}
