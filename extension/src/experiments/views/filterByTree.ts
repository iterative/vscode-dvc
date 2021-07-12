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

export class ExperimentsFilterByTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>
  private treeDataChanged: EventEmitter<string | void>

  private readonly experiments: Experiments

  constructor(
    experiments: Experiments,
    treeDataChanged?: EventEmitter<string | void>
  ) {
    this.treeDataChanged = this.dispose.track(
      treeDataChanged || new EventEmitter()
    )
    this.onDidChangeTreeData = this.treeDataChanged.event

    this.dispose.track(
      window.createTreeView('dvc.views.experimentsFilterByTree', {
        canSelectMany: true,
        showCollapseAll: true,
        treeDataProvider: this
      })
    )

    this.experiments = experiments
  }

  public getTreeItem(element: string): TreeItem {
    return new TreeItem(Uri.file(element), TreeItemCollapsibleState.None)
  }

  public async getChildren(): Promise<string[]> {
    await this.experiments.isReady()
    const filters = this.experiments.getFilteredBy()
    return filters.sort((a, b) => a.localeCompare(b))
  }
}
