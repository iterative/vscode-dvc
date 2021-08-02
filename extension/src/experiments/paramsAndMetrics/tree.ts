import { join } from 'path'
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
import { Status } from './model'
import { Experiments } from '..'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { definedAndNonEmpty, flatten } from '../../util/array'

type ParamsAndMetricsItem = {
  description: string | undefined
  dvcRoot: string
  collapsibleState: TreeItemCollapsibleState
  path: string
  iconPath: Resource
}

export class ExperimentsParamsAndMetricsTree
  implements TreeDataProvider<string | ParamsAndMetricsItem>
{
  public dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: Experiments
  private readonly resourceLocator: ResourceLocator

  private view: TreeView<string | ParamsAndMetricsItem>

  constructor(experiments: Experiments, resourceLocator: ResourceLocator) {
    this.resourceLocator = resourceLocator

    this.onDidChangeTreeData = experiments.paramsOrMetricsChanged.event

    this.view = this.dispose.track(
      window.createTreeView<string | ParamsAndMetricsItem>(
        'dvc.views.experimentsParamsAndMetricsTree',
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
        'dvc.views.experimentsParamsAndMetricsTree.toggleStatus',
        resource => {
          const { dvcRoot, path } = resource
          return this.experiments.toggleParamOrMetricStatus(dvcRoot, path)
        }
      )
    )

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | ParamsAndMetricsItem): TreeItem {
    if (this.isRoot(element)) {
      const resourceUri = Uri.file(element)
      return new TreeItem(resourceUri, TreeItemCollapsibleState.Collapsed)
    }

    const { dvcRoot, path, collapsibleState, description, iconPath } = element

    const treeItem = new TreeItem(
      Uri.file(join(dvcRoot, path)),
      collapsibleState
    )

    treeItem.command = {
      arguments: [{ dvcRoot, path }],
      command: 'dvc.views.experimentsParamsAndMetricsTree.toggleStatus',
      title: 'toggle'
    }

    treeItem.iconPath = iconPath
    if (description) {
      treeItem.description = description
    }

    return treeItem
  }

  public getChildren(
    element?: string | ParamsAndMetricsItem
  ): Promise<ParamsAndMetricsItem[] | string[]> {
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
        this.view.description = this.getDescription(statuses, ' of ')
      })
    )
  }

  private async getRootElements() {
    await this.experiments.isReady()
    const dvcRoots = this.experiments.getDvcRoots()

    if (dvcRoots.length === 1) {
      const [onlyRepo] = dvcRoots
      return this.getChildren(onlyRepo)
    }

    return dvcRoots.sort((a, b) => a.localeCompare(b))
  }

  private getParamsOrMetrics(
    element: string | ParamsAndMetricsItem
  ): ParamsAndMetricsItem[] {
    if (!element) {
      return []
    }

    const [dvcRoot, path] = this.getDetails(element)

    return this.experiments
      .getChildParamsOrMetrics(dvcRoot, path)
      .map(paramOrMetric => {
        const { descendantStatuses, hasChildren, path, status } = paramOrMetric

        const description = this.getDescription(descendantStatuses, '/')
        const iconPath = this.getIconPath(status)
        const collapsibleState = hasChildren
          ? TreeItemCollapsibleState.Collapsed
          : TreeItemCollapsibleState.None

        return { collapsibleState, description, dvcRoot, iconPath, path }
      })
  }

  private getDetails(element: string | ParamsAndMetricsItem) {
    if (this.isRoot(element)) {
      return [element, '']
    }
    const { dvcRoot, path } = element
    return [dvcRoot, path]
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

  private getDescription(statuses: Status[], separator: string) {
    if (!definedAndNonEmpty(statuses)) {
      return
    }
    return `${
      statuses.filter(status =>
        [Status.selected, Status.indeterminate].includes(status)
      ).length
    }${separator}${statuses.length}`
  }

  private isRoot(element: string | ParamsAndMetricsItem): element is string {
    return typeof element === 'string'
  }
}
