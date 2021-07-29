import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  Uri
} from 'vscode'
import { SortDefinition } from './'
import { Experiments } from '../..'

export class ExperimentsSortByTree
  implements TreeDataProvider<string | SortDefinition>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<void>

  private readonly experiments: Experiments

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.dispose.track(
      window.createTreeView<string | SortDefinition>(
        'dvc.views.experimentsSortByTree',
        {
          canSelectMany: true,
          showCollapseAll: true,
          treeDataProvider: this
        }
      )
    )

    this.experiments = experiments
  }

  public getTreeItem(element: string | SortDefinition): TreeItem {
    if (typeof element === 'string') {
      return this.getTreeItemFromDvcRoot(element as string)
    }
    return this.getTreeItemFromSortDefinition(element as SortDefinition)
  }

  public getChildren(
    parent: undefined | string
  ): string[] | SortDefinition[] | Promise<string[] | SortDefinition[]> {
    if (parent === undefined) {
      return this.getRootItems()
    }

    return this.experiments.getSorts(parent)
  }

  private async getRootItems() {
    await this.experiments.isReady()
    const roots = this.experiments.getDvcRoots()
    if (roots.length === 1) {
      return this.getChildren(roots[0])
    } else {
      return roots.sort((a, b) => a.localeCompare(b))
    }
  }

  private getTreeItemFromDvcRoot(rootPath: string) {
    const projectTreeItem = new TreeItem(
      Uri.file(rootPath),
      TreeItemCollapsibleState.Expanded
    )

    projectTreeItem.id = rootPath
    projectTreeItem.contextValue = 'sortByTreeProject'

    return projectTreeItem
  }

  private getTreeItemFromSortDefinition(sortDefinition: SortDefinition) {
    const sortDefinitionTreeItem = new TreeItem(sortDefinition.path)

    sortDefinitionTreeItem.iconPath = new ThemeIcon(
      sortDefinition.descending ? 'arrow-down' : 'arrow-up'
    )
    sortDefinitionTreeItem.contextValue = 'sortByTreeSortDefinition'

    return sortDefinitionTreeItem
  }
}
