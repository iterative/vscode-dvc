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
import { ColumnStatus } from '../table'

export class ExperimentsColumnsTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>
  private treeDataChanged: EventEmitter<string | void>

  private readonly experiments: Experiments
  private readonly resourceLocator: ResourceLocator
  private pathRoots: Record<string, string> = {}

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
          const [dvcRoot, path] = this.getDetails(resource)
          const isSelected = this.experiments.setIsColumnSelected(dvcRoot, path)
          this.treeDataChanged.fire()
          return isSelected
        }
      )
    )
  }

  public getTreeItem(element: string): TreeItem {
    const resourceUri = Uri.file(element)

    const [dvcRoot, path] = this.getDetails(element)

    if (!path) {
      return new TreeItem(resourceUri, TreeItemCollapsibleState.Collapsed)
    }

    const column = this.experiments.getColumn(dvcRoot, path)
    const hasChildren = !!column?.hasChildren

    const treeItem = new TreeItem(
      resourceUri,
      hasChildren
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    treeItem.command = {
      arguments: [element],
      command: 'dvc.views.experimentColumnsTree.toggleSelected',
      title: 'toggle'
    }

    treeItem.iconPath = this.getIconPath(column?.isSelected)

    if (hasChildren) {
      treeItem.description = column?.descendantMetadata
    }

    return treeItem
  }

  public getChildren(element?: string): Promise<string[]> {
    if (element) {
      return Promise.resolve(this.getColumns(element))
    }

    return this.getRootElements()
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots() || []
    dvcRoots.forEach(dvcRoot => {
      this.pathRoots[dvcRoot] = dvcRoot
    })

    return dvcRoots.sort((a, b) => a.localeCompare(b))
  }

  private getColumns(element: string): string[] {
    if (!element) {
      return []
    }

    const [dvcRoot, path] = this.getDetails(element)
    const columns = this.experiments.getChildColumns(dvcRoot, path)

    return columns?.map(column => this.processColumn(dvcRoot, column)) || []
  }

  private processColumn(dvcRoot: string, column: ColumnData) {
    const absPath = join(dvcRoot, column.path)
    this.pathRoots[absPath] = dvcRoot
    return absPath
  }

  private getDetails(element: string) {
    const dvcRoot = this.getRoot(element)
    const path = relative(dvcRoot, element)
    return [dvcRoot, path]
  }

  private getRoot(element: string) {
    return this.pathRoots[element]
  }

  private getIconPath(status?: ColumnStatus) {
    if (status === ColumnStatus.selected) {
      return this.resourceLocator.checkedCheckbox
    }
    if (status === ColumnStatus.indeterminate) {
      return this.resourceLocator.indeterminateCheckbox
    }
    return this.resourceLocator.emptyCheckbox
  }
}
