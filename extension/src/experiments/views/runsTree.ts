import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window
} from 'vscode'
import { Experiments } from '..'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { RowStatus } from '../collectFromRepo'

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

    const row = this.experiments.getRow(this.runRoots[element], element)

    if (!row) {
      const item = new TreeItem(element, TreeItemCollapsibleState.None)
      item.iconPath = new ThemeIcon('primitive-dot')
      return item
    }

    const running = row?.status === RowStatus.RUNNING
    const hasChildren = definedAndNonEmpty(row?.children)

    const collapsibleState = hasChildren
      ? TreeItemCollapsibleState.Collapsed
      : TreeItemCollapsibleState.None

    const item = new TreeItem(element, collapsibleState)
    item.iconPath = running
      ? new ThemeIcon('loading~spin')
      : new ThemeIcon('watch')
    return item
  }

  public getChildren(element?: string): Promise<string[]> {
    if (!element) {
      return this.getRootElements()
    }

    if (this.isRoot(element)) {
      return Promise.resolve(this.getRunningOrQueued(element))
    }

    return Promise.resolve(
      this.experiments.getChildRows(this.runRoots[element], element) || []
    )
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()
    const runningOrQueued = flatten(
      dvcRoots.map(dvcRoot => {
        this.runRoots[dvcRoot] = dvcRoot
        return this.experiments.getRunningOrQueued(dvcRoot)
      })
    )
    if (definedAndNonEmpty(runningOrQueued)) {
      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private getRunningOrQueued(dvcRoot: string): string[] {
    const runningOrQueued = this.experiments.getRunningOrQueued(dvcRoot)
    runningOrQueued.forEach(experiment => (this.runRoots[experiment] = dvcRoot))
    return runningOrQueued
  }

  private isRoot(element: string) {
    return Object.values(this.runRoots).includes(element)
  }
}
