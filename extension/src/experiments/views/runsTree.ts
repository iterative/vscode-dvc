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

export class ExperimentsRunsTree implements TreeDataProvider<string> {
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
    return new TreeItem(Uri.file(element), TreeItemCollapsibleState.None)
  }

  public async getChildren(element?: string): Promise<string[]> {
    await this.experiments.isReady()

    if (element) {
      return this.getSubExperiment()
    }

    const runs = await this.experiments.getRunningOrQueued()
    return runs
      .sort((a, b) => {
        if (a.queued === b.queued) {
          return a.name.localeCompare(b.name)
        }
        return a.queued ? -1 : 1
      })
      .map(exp => exp.name)
  }

  private getSubExperiment() {
    return []
  }
}

// watch
// run
