import { join } from 'path'
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
import { FilterDefinition, getFilterId } from '.'
import { Experiments } from '../..'
import { definedAndNonEmpty, flatten } from '../../../util/array'

type Filter = FilterDefinition & { dvcRoot: string; id: string }

export class ExperimentsFilterByTree
  implements TreeDataProvider<string | Filter>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.dispose.track(
      window.createTreeView<string | Filter>(
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
        resource => this.removeFilter(resource as Filter)
      )
    )

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsFilterByTree.removeAllFilters',
        resource => this.removeAllFilters(resource)
      )
    )
  }

  public getTreeItem(element: string | Filter): TreeItem {
    if (this.isRoot(element)) {
      const item = new TreeItem(
        Uri.file(element),
        TreeItemCollapsibleState.Collapsed
      )
      item.contextValue = 'dvcFilterRoot'
      return item
    }

    const filter = element as Filter
    const { id } = filter

    const item = new TreeItem(Uri.file(id), TreeItemCollapsibleState.None)

    if (!id) {
      return item
    }

    item.iconPath = new ThemeIcon('filter')

    item.label = filter.path
    item.description = [filter.operator, filter.value].join(' ')
    item.contextValue = 'dvcFilter'

    return item
  }

  public getChildren(element?: string): Promise<string[] | Filter[]> {
    if (!element) {
      return this.getRootElements()
    }

    return Promise.resolve(
      this.experiments.getFilters(element).map(filter => {
        return {
          ...filter,
          dvcRoot: element,
          id: join(element, getFilterId(filter))
        }
      })
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
    filters.map(filter => this.removeFilter(filter as Filter))
  }

  private removeFilter(filter: Filter) {
    this.experiments.removeFilter(filter.dvcRoot, getFilterId(filter))
  }

  private isRoot(element: string | Filter): element is string {
    return typeof element === 'string'
  }

  private getDvcRoots() {
    return this.experiments.getDvcRoots()
  }
}
