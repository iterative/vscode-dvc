import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window
} from 'vscode'
import { Experiments } from '..'
import { SortDefinition } from '../model/sorting'

export class ExperimentsSortByTree
  implements TreeDataProvider<string | SortDefinition>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<void>

  private readonly experiments: Experiments

  constructor(experiments: Experiments) {
    this.onDidChangeTreeData = experiments.experimentsRowsChanged.event

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
      const projectTreeItem = new TreeItem(
        element,
        TreeItemCollapsibleState.Expanded
      )
      projectTreeItem.id = element
      return projectTreeItem
    }

    const sortDefinitionTreeItem = new TreeItem({
      label: `${element.columnPath}`
    })

    sortDefinitionTreeItem.iconPath = new ThemeIcon(
      element.descending ? 'arrow-down' : 'arrow-up'
    )

    return sortDefinitionTreeItem
  }

  public getChildren(parent: undefined | string): string[] | SortDefinition[] {
    if (parent === undefined) {
      const roots = this.experiments.getDvcRoots()
      if (roots.length === 1) {
        return this.getChildren(roots[0])
      } else {
        return roots
      }
    }

    const sort = this.experiments.getSort(parent)

    return sort ? [sort] : []
  }
}
