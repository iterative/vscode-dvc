import { join, relative } from 'path'
import { Disposable } from '@hediet/std/disposable'
import {
  commands,
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window
} from 'vscode'
import { Experiments } from '..'
import { ResourceLocator } from '../../resourceLocator'
import { ColumnData } from '../webview/contract'

export class ExperimentsColumnsTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>
  private treeDataChanged: EventEmitter<string | void>

  private readonly experiments: Experiments
  private readonly resourceLocator: ResourceLocator
  private pathRoots: Record<string, string> = {}
  private hasChildren: Record<string, boolean> = {}

  constructor(
    experiments: Experiments,
    resourceLocator: ResourceLocator,
    treeDataChanged?: EventEmitter<string | void>
  ) {
    this.resourceLocator = resourceLocator

    this.treeDataChanged = this.dispose.track(
      treeDataChanged || new EventEmitter()
    )
    this.onDidChangeTreeData = this.treeDataChanged.event

    this.dispose.track(
      window.createTreeView('dvc.views.experimentColumnsTree', {
        canSelectMany: true,
        showCollapseAll: true,
        treeDataProvider: this
      })
    )

    this.experiments = experiments

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentColumnsTree.toggleSelected',
        resource => {
          const dvcRoot = this.pathRoots[resource]
          const path = relative(dvcRoot, resource)
          this.experiments.setSelected(dvcRoot, path)
          this.treeDataChanged.fire(resource)
        }
      )
    )
  }

  public getTreeItem(element: string): TreeItem {
    const resourceUri = Uri.file(element)
    const itemHasChildren = this.hasChildren[element]
    const treeItem = new TreeItem(
      resourceUri,
      itemHasChildren
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )
    treeItem.command = {
      arguments: [element],
      command: 'dvc.views.experimentColumnsTree.toggleSelected',
      title: 'toggle'
    }

    const dvcRoot = this.pathRoots[element]
    const path = relative(dvcRoot, element)

    if (path) {
      treeItem.iconPath = this.experiments.getSelected(dvcRoot, path)
        ? this.resourceLocator.selectedCheckbox
        : this.resourceLocator.unselectedCheckbox
    }

    return treeItem
  }

  public getChildren(element?: string): string[] {
    if (element) {
      return this.getColumns(this.pathRoots[element], element)
    }

    return this.getRootElements()
  }

  private getRootElements() {
    const dvcRoots = this.experiments.getDvcRoots() || []
    dvcRoots.forEach(dvcRoot => {
      this.pathRoots[dvcRoot] = dvcRoot
      this.hasChildren[dvcRoot] = true
    })

    return dvcRoots.sort((a, b) => a.localeCompare(b))
  }

  private getColumns(dvcRoot: string, element: string): string[] {
    if (!element) {
      return []
    }

    const path = relative(dvcRoot, element)

    const columns = this.experiments.getColumns(dvcRoot)

    return (
      columns
        ?.filter(column =>
          path
            ? column.parentPath === path
            : ['metrics', 'params'].includes(column.parentPath)
        )
        ?.map(column => this.processColumn(dvcRoot, column, columns)) || []
    )
  }

  private processColumn(
    dvcRoot: string,
    column: ColumnData,
    columnData: ColumnData[]
  ) {
    const absPath = join(dvcRoot, column.path)
    this.pathRoots[absPath] = dvcRoot
    this.hasChildren[absPath] = !!columnData.find(
      otherColumn => column.path === otherColumn.parentPath
    )
    return absPath
  }
}
