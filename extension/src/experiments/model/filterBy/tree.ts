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
import { getFilterId } from '.'
import { Experiments } from '../..'
import { definedAndNonEmpty, flatten } from '../../../util/array'

type FilterItem = {
  description: string
  dvcRoot: string
  id: string
  label: string
}

export class ExperimentsFilterByTree
  implements TreeDataProvider<string | FilterItem>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.dispose.track(
      window.createTreeView<string | FilterItem>(
        'dvc.views.experimentsFilterByTree',
        {
          canSelectMany: true,
          showCollapseAll: true,
          treeDataProvider: this
        }
      )
    )

    this.experiments = experiments

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsFilterByTree.removeFilter',
        resource => this.removeFilter(resource as FilterItem)
      )
    )

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsFilterByTree.removeAllFilters',
        resource => this.removeAllFilters(resource)
      )
    )
  }

  public getTreeItem(element: string | FilterItem): TreeItem {
    if (this.isRoot(element)) {
      const item = new TreeItem(
        Uri.file(element),
        TreeItemCollapsibleState.Collapsed
      )
      item.contextValue = 'dvcFilterRoot'
      return item
    }

    const item = new TreeItem(element.label, TreeItemCollapsibleState.None)

    item.iconPath = new ThemeIcon('filter')
    item.description = element.description
    item.contextValue = 'dvcFilter'

    return item
  }

  public getChildren(element?: string): Promise<string[] | FilterItem[]> {
    if (!element) {
      return this.getRootElements()
    }

    return Promise.resolve(
      this.experiments.getFilters(element).map(filter => ({
        description: [filter.operator, filter.value].join(' '),
        dvcRoot: element,
        id: getFilterId(filter),
        label: filter.path
      }))
    )
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.getDvcRoots()
    const filters = flatten(
      dvcRoots.map(dvcRoot => this.experiments.getFilters(dvcRoot))
    )
    if (definedAndNonEmpty(filters)) {
      if (dvcRoots.length === 1) {
        const [onlyRepo] = dvcRoots
        return this.getChildren(onlyRepo)
      }

      return dvcRoots.sort((a, b) => a.localeCompare(b))
    }

    return []
  }

  private async removeAllFilters(element: string | undefined) {
    if (!element) {
      const dvcRoots = this.getDvcRoots()
      dvcRoots.map(dvcRoot => this.removeAllFilters(dvcRoot))
      return
    }

    const filters = await this.getChildren(element)
    filters.map(filter => this.removeFilter(filter as FilterItem))
  }

  private removeFilter(filter: FilterItem) {
    this.experiments.removeFilter(filter.dvcRoot, filter.id)
  }

  private isRoot(element: string | FilterItem): element is string {
    return typeof element === 'string'
  }

  private getDvcRoots() {
    return this.experiments.getDvcRoots()
  }
}
