import { Disposable } from '@hediet/std/disposable'
import {
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

  private experiments: Experiments

  constructor(experiments: Experiments) {
    window.registerTreeDataProvider('dvc.views.experimentColumnsTree', this)
    this.experiments = experiments
  }

  public getTreeItem(element: string): TreeItem {
    const resourceUri = Uri.file(element)
    return new TreeItem(resourceUri, TreeItemCollapsibleState.Collapsed)
  }

  public getChildren(element?: string): string[] {
    if (element) {
      return this.getColumns(element)
    }

    const dvcRoots = this.experiments.getExperimentRoots()
    if (definedAndNonEmpty(dvcRoots)) {
      return this.getRootElements()
    }

    return []
  }

  private getRootElements() {
    const rootElements = this.experiments.getExperimentRoots()

    return rootElements.sort((a, b) => a.localeCompare(b))
  }

  private getColumns(root: string): string[] {
    if (!root) {
      return []
    }

    return this.experiments.getColumns(root)?.map(x => x.name) || []
  }
}
