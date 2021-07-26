import { join, relative } from 'path'
import { Disposable } from '@hediet/std/disposable'
import {
  commands,
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
import { getFilterId } from '../model/filtering'

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

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsFilterByTree.removeFilter',
        resource => this.removeFilter(resource)
      )
    )

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsFilterByTree.removeAllFilters',
        resource => this.removeAllFilters(resource)
      )
    )
  }

  public getTreeItem(element: string): TreeItem {
    if (this.isRoot(element)) {
      const item = new TreeItem(
        Uri.file(element),
        TreeItemCollapsibleState.Collapsed
      )
      item.contextValue = 'dvcFilterRoot'
      return item
    }

    const filter = this.getFilter(element)

    const item = new TreeItem(Uri.file(element), TreeItemCollapsibleState.None)

    if (!filter) {
      return item
    }

    item.iconPath = new ThemeIcon('filter')

    item.label = filter.path
    item.description = [filter.operator, filter.value].join(' ')
    item.contextValue = 'dvcFilter'

    return item
  }

  public getChildren(element?: string): Promise<string[]> {
    if (!element) {
      return this.getRootElements()
    }

    return Promise.resolve(
      this.experiments.getFilters(element).map(filter => {
        const id = join(element, getFilterId(filter))
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
        return this.experiments.getFilters(dvcRoot)
      })
    )
    if (definedAndNonEmpty(filters)) {
      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private getFilter(element: string) {
    const [dvcRoot, id] = this.getDetails(element)
    return this.experiments.getFilter(dvcRoot, id)
  }

  private async removeAllFilters(element: string | undefined) {
    if (!element) {
      const dvcRoots = await this.getRootElements()
      dvcRoots.map(dvcRoot => this.removeAllFilters(dvcRoot))
      return
    }

    const filters = await this.getChildren(element)
    filters.map(filter => this.removeFilter(filter))
  }

  private removeFilter(element: string) {
    const [dvcRoot, id] = this.getDetails(element)
    this.experiments.removeFilter(dvcRoot, id)
  }

  private getDetails(element: string) {
    const dvcRoot = this.filterRoots[element]
    const id = relative(dvcRoot, element)
    return [dvcRoot, id]
  }

  private isRoot(element: string) {
    return Object.values(this.filterRoots).includes(element)
  }
}
