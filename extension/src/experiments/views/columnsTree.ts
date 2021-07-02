import { relative } from 'path'
import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  window
} from 'vscode'
import { Experiments } from '..'
import { definedAndNonEmpty } from '../../util/array'

export class ExperimentsColumnsTree implements TreeDataProvider<string> {
  public dispose = Disposable.fn()
  public readonly onDidChangeTreeData: Event<string | void>

  private experiments: Experiments
  private pathRoots: Record<string, string> = {}
  private hasChildren: Record<string, boolean> = {}
  private treeDataChanged: EventEmitter<string>

  constructor(
    experiments: Experiments,
    treeDataChanged?: EventEmitter<string>
  ) {
    window.registerTreeDataProvider('dvc.views.experimentColumnsTree', this)

    this.experiments = experiments

    this.treeDataChanged = this.dispose.track(
      treeDataChanged || new EventEmitter()
    )
    this.onDidChangeTreeData = this.treeDataChanged.event
  }

  public getTreeItem(element: string): TreeItem {
    const resourceUri = Uri.file(element)
    return new TreeItem(
      resourceUri,
      this.hasChildren[element]
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )
  }

  public getChildren(element?: string): string[] {
    if (element) {
      return this.getColumns(this.pathRoots[element], element)
    }

    const dvcRoots = this.experiments.getExperimentRoots()
    if (definedAndNonEmpty(dvcRoots)) {
      return this.getRootElements()
    }

    return []
  }

  private getRootElements() {
    const rootElements = this.experiments.getExperimentRoots()
    rootElements.map(dvcRoot => {
      this.pathRoots[dvcRoot] = dvcRoot
      this.hasChildren[dvcRoot] = true
    })

    return rootElements.sort((a, b) => a.localeCompare(b))
  }

  private getColumns(dvcRoot: string, element: string): string[] {
    if (!element) {
      return []
    }

    const path = relative(dvcRoot, element)

    const columnData = this.getColumnData(dvcRoot, path)

    return (
      columnData?.map(x => {
        const absPath = [dvcRoot, ...x.path].join('/')
        this.pathRoots[absPath] = dvcRoot
        this.hasChildren[absPath] = !!x.childColumns
        return absPath
      }) || []
    )
  }

  private getColumnData(dvcRoot: string, path: string) {
    let cols = this.experiments.getColumns(dvcRoot)

    if (path) {
      const steps = path.split('/')

      let p = ''
      steps.map(() => {
        if (p !== path) {
          cols = cols?.find(col => {
            p = col.path.join('/')
            return path.includes(p)
          })?.childColumns
        }
      })
    }
    return cols
  }
}
