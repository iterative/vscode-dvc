import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri
} from 'vscode'
import { ParamsAndMetricsModel, Status } from './model'
import { splitParamOrMetricPath } from './paths'
import { Experiments } from '..'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { createTreeView } from '../../vscode/tree'
import { RegisteredCommands } from '../../commands/external'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { InternalCommands } from '../../commands/internal'

type ParamsAndMetricsItem = {
  description: string | undefined
  dvcRoot: string
  collapsibleState: TreeItemCollapsibleState
  path: string
  statePath: string
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
  private viewed = false

  constructor(
    experiments: Experiments,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.resourceLocator = resourceLocator

    this.onDidChangeTreeData = experiments.paramsOrMetricsChanged.event

    this.view = this.dispose.track(
      createTreeView<ParamsAndMetricsItem>(
        'dvc.views.experimentsParamsAndMetricsTree',
        this
      )
    )

    this.experiments = experiments

    internalCommands.registerExternalCommand<ParamsAndMetricsItem>(
      RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
      ({ dvcRoot, statePath }) =>
        this.experiments.toggleParamOrMetricStatus(dvcRoot, statePath)
    )

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | ParamsAndMetricsItem): TreeItem {
    if (this.isRoot(element)) {
      const resourceUri = Uri.file(element)
      return new TreeItem(resourceUri, TreeItemCollapsibleState.Collapsed)
    }

    const {
      dvcRoot,
      collapsibleState,
      description,
      iconPath,
      path,
      statePath
    } = element

    const splitPath = splitParamOrMetricPath(path)
    const finalPathSegment = splitPath[splitPath.length - 1]
    const treeItem = new TreeItem(finalPathSegment, collapsibleState)

    treeItem.command = {
      arguments: [{ dvcRoot, statePath }],
      command: RegisteredCommands.EXPERIMENT_PARAMS_AND_METRICS_TOGGLE,
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

    if (!this.viewed) {
      sendViewOpenedTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_PARAMS_AND_METRICS_TREE_OPENED,
        dvcRoots.length
      )
      this.viewed = true
    }

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

    const [dvcRoot, statePath] = this.getDetails(element)

    return this.experiments
      .getChildParamsOrMetrics(dvcRoot, statePath)
      .map(paramOrMetric => {
        const { descendantStatuses, hasChildren, status } = paramOrMetric

        const statePath = paramOrMetric.path
        const path = ParamsAndMetricsModel.getCleanPath(paramOrMetric.path)
        const description = this.getDescription(descendantStatuses, '/')
        const iconPath = this.getIconPath(status)
        const collapsibleState = hasChildren
          ? TreeItemCollapsibleState.Collapsed
          : TreeItemCollapsibleState.None

        return {
          collapsibleState,
          description,
          dvcRoot,
          iconPath,
          path,
          statePath
        }
      })
  }

  private getDetails(element: string | ParamsAndMetricsItem) {
    if (this.isRoot(element)) {
      return [element, '']
    }
    const { dvcRoot, statePath } = element
    return [dvcRoot, statePath]
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
