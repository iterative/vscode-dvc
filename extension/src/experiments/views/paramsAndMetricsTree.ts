import { join, relative } from 'path'
import { Disposable } from '@hediet/std/disposable'
import {
  commands,
  Event,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri,
  window
} from 'vscode'
import { Experiments } from '..'
import { ResourceLocator } from '../../resourceLocator'
import { ParamOrMetric } from '../webview/contract'
import { Status } from '../model/paramsAndMetrics'
import { flatten } from '../../util/array'

export class ExperimentsParamsAndMetricsTree
  implements TreeDataProvider<string>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments
  private readonly resourceLocator: ResourceLocator
  private pathRoots: Record<string, string> = {}

  private view: TreeView<string>

  constructor(experiments: Experiments, resourceLocator: ResourceLocator) {
    this.resourceLocator = resourceLocator

    this.onDidChangeTreeData = experiments.paramsOrMetricsChanged.event

    this.view = this.dispose.track(
      window.createTreeView('dvc.views.experimentsParamsAndMetricsTree', {
        canSelectMany: true,
        showCollapseAll: true,
        treeDataProvider: this
      })
    )

    this.experiments = experiments

    this.dispose.track(
      commands.registerCommand(
        'dvc.views.experimentsParamsAndMetricsTree.toggleStatus',
        resource => {
          const [dvcRoot, path] = this.getDetails(resource)
          return this.experiments.toggleParamOrMetricStatus(dvcRoot, path)
        }
      )
    )

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string): TreeItem {
    const resourceUri = Uri.file(element)

    const [dvcRoot, path] = this.getDetails(element)

    if (!path) {
      return new TreeItem(resourceUri, TreeItemCollapsibleState.Collapsed)
    }

    const paramOrMetric = this.experiments.getParamOrMetric(dvcRoot, path)
    const hasChildren = !!paramOrMetric?.hasChildren

    const treeItem = new TreeItem(
      resourceUri,
      hasChildren
        ? TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None
    )

    treeItem.command = {
      arguments: [element],
      command: 'dvc.views.experimentsParamsAndMetricsTree.toggleStatus',
      title: 'toggle'
    }

    treeItem.iconPath = this.getIconPath(paramOrMetric?.status)

    if (hasChildren) {
      treeItem.description = paramOrMetric?.descendantMetadata
    }

    return treeItem
  }

  public getChildren(element?: string): Promise<string[]> {
    if (element) {
      return Promise.resolve(this.getParamsOrMetrics(element))
    }

    return this.getRootElements()
  }

  private updateDescriptionOnChange() {
    this.dispose.track(
      this.onDidChangeTreeData(() => {
        const dvcRoots = this.experiments.getDvcRoots()
        const statuses = flatten<Status>(
          dvcRoots.map(dvcRoot =>
            this.experiments.getParamsAndMetricsStatuses(dvcRoot)
          )
        )
        this.view.description = `${
          statuses.filter(status =>
            [Status.selected, Status.indeterminate].includes(status)
          ).length
        } of ${statuses.length}`
      })
    )
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()
    dvcRoots.forEach(dvcRoot => {
      this.pathRoots[dvcRoot] = dvcRoot
    })

    if (dvcRoots.length === 1) {
      const [onlyRepo] = dvcRoots
      return this.getChildren(onlyRepo)
    }

    return dvcRoots.sort((a, b) => a.localeCompare(b))
  }

  private getParamsOrMetrics(element: string): string[] {
    if (!element) {
      return []
    }

    const [dvcRoot, path] = this.getDetails(element)
    const paramsOrMetrics = this.experiments.getChildParamsOrMetrics(
      dvcRoot,
      path
    )

    return (
      paramsOrMetrics?.map(paramOrMetric =>
        this.processParamOrMetric(dvcRoot, paramOrMetric)
      ) || []
    )
  }

  private processParamOrMetric(dvcRoot: string, paramOrMetric: ParamOrMetric) {
    const absPath = join(dvcRoot, paramOrMetric.path)
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

  private getIconPath(status?: Status) {
    if (status === Status.selected) {
      return this.resourceLocator.checkedCheckbox
    }
    if (status === Status.indeterminate) {
      return this.resourceLocator.indeterminateCheckbox
    }
    return this.resourceLocator.emptyCheckbox
  }
}
