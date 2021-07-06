import { join, relative, sep } from 'path'
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

export class ExperimentsColumnsTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>
  private treeDataChanged: EventEmitter<string | void>

  private readonly experiments: Experiments
  private readonly resourceLocator: ResourceLocator
  private pathRoots: Record<string, string> = {}
  private hasChildren: Record<string, boolean> = {}
  private parents: Record<string, string> = {}
  private selected: Record<string, boolean> = {}

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
          const selected = this.selected[resource]
          this.selected[resource] = !selected
          this.treeDataChanged.fire(resource)
        }
      )
    )
  }

  public getParent(element: string): string {
    return this.parents[element]
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

    treeItem.iconPath = this.selected[element]
      ? this.resourceLocator.selectedCheckbox
      : this.resourceLocator.unselectedCheckbox

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
      this.selected[dvcRoot] = true
    })

    return dvcRoots.sort((a, b) => a.localeCompare(b))
  }

  private getColumns(dvcRoot: string, element: string): string[] {
    if (!element) {
      return []
    }

    const path = relative(dvcRoot, element)

    const columnData = this.getColumnData(dvcRoot, path)

    return (
      columnData?.map(column => {
        const absPath = join(dvcRoot, ...column.path)
        this.pathRoots[absPath] = dvcRoot
        this.hasChildren[absPath] = !!column.childColumns
        if (this.selected[absPath] === undefined) {
          this.selected[absPath] = true
        }
        this.parents[absPath] = element
        return absPath
      }) || []
    )
  }

  private getColumnData(dvcRoot: string, path: string) {
    let cols = this.experiments.getColumns(dvcRoot)

    if (path) {
      const steps = path.split(sep)

      let p = ''
      steps.map(() => {
        if (p !== path) {
          cols = cols?.find(col => {
            p = join(...col.path)
            return path.includes(p)
          })?.childColumns
        }
      })
    }
    return cols
  }
}
