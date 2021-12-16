import { Disposable } from '@hediet/std/disposable'
import {
  Event,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  TreeView,
  Uri
} from 'vscode'
import { Status } from './model'
import { splitMetricOrParamPath } from './paths'
import { WorkspaceExperiments } from '../workspace'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { createTreeView } from '../../vscode/tree'
import { RegisteredCommands } from '../../commands/external'
import { sendViewOpenedTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { InternalCommands } from '../../commands/internal'

type MetricsAndParamsItem = {
  description: string | undefined
  dvcRoot: string
  collapsibleState: TreeItemCollapsibleState
  path: string
  iconPath: Resource
}

export class ExperimentsMetricsAndParamsTree
  implements TreeDataProvider<string | MetricsAndParamsItem>
{
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeTreeData: Event<string | void>

  private readonly experiments: WorkspaceExperiments
  private readonly resourceLocator: ResourceLocator

  private readonly view: TreeView<string | MetricsAndParamsItem>
  private viewed = false

  constructor(
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.resourceLocator = resourceLocator

    this.onDidChangeTreeData = experiments.metricsOrParamsChanged.event

    this.view = this.dispose.track(
      createTreeView<MetricsAndParamsItem>(
        'dvc.views.experimentsMetricsAndParamsTree',
        this
      )
    )

    this.experiments = experiments

    internalCommands.registerExternalCommand<MetricsAndParamsItem>(
      RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
      ({ dvcRoot, path }) =>
        this.experiments.getRepository(dvcRoot).toggleMetricOrParamStatus(path)
    )

    this.updateDescriptionOnChange()
  }

  public getTreeItem(element: string | MetricsAndParamsItem): TreeItem {
    if (this.isRoot(element)) {
      const resourceUri = Uri.file(element)
      return new TreeItem(resourceUri, TreeItemCollapsibleState.Collapsed)
    }

    const { dvcRoot, path, collapsibleState, description, iconPath } = element

    const splitPath = splitMetricOrParamPath(path)
    const finalPathSegment = splitPath[splitPath.length - 1]
    const treeItem = new TreeItem(finalPathSegment, collapsibleState)

    treeItem.command = {
      arguments: [{ dvcRoot, path }],
      command: RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
      title: 'toggle'
    }

    treeItem.iconPath = iconPath
    if (description) {
      treeItem.description = description
    }

    return treeItem
  }

  public getChildren(
    element?: string | MetricsAndParamsItem
  ): Promise<MetricsAndParamsItem[] | string[]> {
    if (element) {
      return Promise.resolve(this.getMetricsOrParams(element))
    }

    return this.getRootElements()
  }

  private updateDescriptionOnChange() {
    this.dispose.track(
      this.onDidChangeTreeData(() => {
        const dvcRoots = this.experiments.getDvcRoots()
        const statuses = flatten<Status>(
          dvcRoots.map(dvcRoot =>
            this.experiments
              .getRepository(dvcRoot)
              .getMetricsAndParamsStatuses()
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
        EventName.VIEWS_EXPERIMENTS_METRICS_AND_PARAMS_TREE_OPENED,
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

  private getMetricsOrParams(
    element: string | MetricsAndParamsItem
  ): MetricsAndParamsItem[] {
    if (!element) {
      return []
    }

    const [dvcRoot, path] = this.getDetails(element)

    return this.experiments
      .getRepository(dvcRoot)
      .getChildMetricsOrParams(path)
      .map(metricOrParam => {
        const { descendantStatuses, hasChildren, path, status } = metricOrParam

        const description = this.getDescription(descendantStatuses, '/')
        const iconPath = this.getIconPath(status)
        const collapsibleState = hasChildren
          ? TreeItemCollapsibleState.Collapsed
          : TreeItemCollapsibleState.None

        return { collapsibleState, description, dvcRoot, iconPath, path }
      })
  }

  private getDetails(element: string | MetricsAndParamsItem) {
    if (this.isRoot(element)) {
      return [element, '']
    }
    const { dvcRoot, path } = element
    return [dvcRoot, path]
  }

  private getIconPath(status?: Status) {
    if (status === Status.SELECTED) {
      return this.resourceLocator.checkedCheckbox
    }
    if (status === Status.INDETERMINATE) {
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
        [Status.SELECTED, Status.INDETERMINATE].includes(status)
      ).length
    }${separator}${statuses.length}`
  }

  private isRoot(element: string | MetricsAndParamsItem): element is string {
    return typeof element === 'string'
  }
}
