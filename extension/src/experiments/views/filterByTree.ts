import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window
} from 'vscode'
import { Experiments } from '..'
import { definedAndNonEmpty, flatten } from '../../util/array'

export class ExperimentsFilterByTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments
  private filterRoots: Record<string, string> = {}

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsRowsChanged.event

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
    if (this.isRoot(element)) {
      return new TreeItem(Uri.file(element), TreeItemCollapsibleState.Collapsed)
    }

    return new TreeItem(element, TreeItemCollapsibleState.None)
  }

  public getChildren(element?: string): Promise<string[]> {
    if (!element) {
      return this.getRootElements()
    }

    return Promise.resolve(
      this.experiments.getFilteredBy(element).map(filter => {
        const id = [filter.columnPath, filter.operator, filter.value].join(' ')
        this.filterRoots[id] = element
        return id
      })
    )
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()
    const filters = flatten(
      dvcRoots.map(dvcRoot => {
        this.filterRoots[dvcRoot] = dvcRoot
        return this.experiments.getFilteredBy(dvcRoot)
      })
    )
    if (definedAndNonEmpty(filters)) {
      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private isRoot(element: string) {
    return Object.values(this.filterRoots).includes(element)
  }
}
