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
    const experiment = this.experiments.getExperiment(
      this.runRoots[element],
      element
    )

    const collapsibleState =
      experiment?.queued === false
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None

    const item = new TreeItem(Uri.file(element), collapsibleState)
    item.iconPath = this.getIcon(experiment)
    return item
  }

  public async getChildren(element?: string): Promise<string[]> {
    await this.experiments.isReady()

    if (element) {
      return this.getChildExperiments(element)
    }

    const runs = await this.experiments.getRunningOrQueued()
    runs.forEach(run => (this.runRoots[run.name] = run.dvcRoot))
    return runs
      .sort((a, b) => {
        if (a.queued === b.queued) {
          return a.name.localeCompare(b.name)
        }
        return a.queued ? 1 : -1
      })
      .map(exp => exp.name)
  }

  private getChildExperiments(element: string) {
    const dvcRoot = this.runRoots[element]
    return this.experiments.getChildExperiments(dvcRoot, element)
  }

  private getIcon(experiment?: { queued: boolean }) {
    if (!experiment) {
      return new ThemeIcon('primitive-dot')
    }
    if (experiment.queued) {
      return new ThemeIcon('watch')
    }
    return new ThemeIcon('run')
  }
}
