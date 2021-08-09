import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  Uri,
  commands
} from 'vscode'
import { SortDefinition } from './'
import { Experiments } from '../..'

export interface SortDefinitionWithParent {
  sort: SortDefinition
  dvcRoot: string
}

export class ExperimentsSortByTree
  implements TreeDataProvider<string | SortDefinitionWithParent>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<void>

  private readonly experiments: Experiments

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsChanged.event

    this.dispose.track(
      window.createTreeView<string | SortDefinitionWithParent>(
        'dvc.views.experimentsSortByTree',
        {
          canSelectMany: true,
          showCollapseAll: true,
          treeDataProvider: this
        }
      )
    )

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsSortByTree.removeSort',
        ({ dvcRoot, sort: { path } }: SortDefinitionWithParent) =>
          this.experiments.removeSort(path, dvcRoot)
      )
    )

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsSortByTree.addSort',
        (dvcRoot: string) => this.experiments.buildAndAddSort(dvcRoot)
      )
    )

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsSortByTree.removeAllSorts',
        (dvcRoot: string) => this.experiments.removeSorts(dvcRoot)
      )
    )

    this.experiments = experiments
  }

  public getTreeItem(element: string | SortDefinitionWithParent): TreeItem {
    if (typeof element === 'string') {
      return this.getTreeItemFromDvcRoot(element)
    }
    return this.getTreeItemFromSortDefinition(element)
  }

  public getChildren(
    dvcRoot: undefined | string
  ):
    | string[]
    | SortDefinitionWithParent[]
    | Promise<string[] | SortDefinitionWithParent[]> {
    if (dvcRoot === undefined) {
      return this.getRootItems()
    }

    return this.experiments.getSorts(dvcRoot).map(sort => ({ dvcRoot, sort }))
  }

  private async getRootItems() {
    await this.experiments.isReady()
    const roots = this.experiments.getDvcRoots()
    if (roots.length === 0) {
      return []
    }
    if (roots.length === 1) {
      return this.getChildren(roots[0])
    }
    if (roots.find(dvcRoot => this.experiments.getSorts(dvcRoot).length > 0)) {
      return roots.sort((a, b) => a.localeCompare(b))
    } else {
      return []
    }
  }

  private getTreeItemFromDvcRoot(rootPath: string) {
    const projectTreeItem = new TreeItem(
      Uri.file(rootPath),
      TreeItemCollapsibleState.Expanded
    )

    projectTreeItem.id = rootPath
    projectTreeItem.contextValue = 'dvcSortRoot'

    return projectTreeItem
  }

  private getTreeItemFromSortDefinition(
    sortWithParent: SortDefinitionWithParent
  ) {
    const { sort } = sortWithParent
    const sortDefinitionTreeItem = new TreeItem(sort.path)

    sortDefinitionTreeItem.iconPath = new ThemeIcon(
      sort.descending ? 'arrow-down' : 'arrow-up'
    )
    sortDefinitionTreeItem.contextValue = 'dvcSort'

    return sortDefinitionTreeItem
  }
}
