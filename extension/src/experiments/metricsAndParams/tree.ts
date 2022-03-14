import { Disposable } from '@hediet/std/disposable'
import { TreeItemCollapsibleState } from 'vscode'
import { splitMetricOrParamPath } from './paths'
import { BasePathSelectionTree } from '../../path/selection/tree'
import { WorkspaceExperiments } from '../workspace'
import { Resource, ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { EventName } from '../../telemetry/constants'
import { InternalCommands } from '../../commands/internal'

type MetricsAndParamsItem = {
  description: string | undefined
  dvcRoot: string
  collapsibleState: TreeItemCollapsibleState
  label: string
  path: string
  iconPath: Resource
}

export class ExperimentsMetricsAndParamsTree extends BasePathSelectionTree<
  MetricsAndParamsItem,
  WorkspaceExperiments
> {
  public readonly dispose = Disposable.fn()

  private readonly experiments: WorkspaceExperiments

  constructor(
    experiments: WorkspaceExperiments,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    super(
      experiments,
      resourceLocator,
      'dvc.views.experimentsMetricsAndParamsTree',
      experiments.metricsOrParamsChanged.event,
      RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
      EventName.VIEWS_EXPERIMENTS_METRICS_AND_PARAMS_TREE_OPENED
    )

    this.experiments = experiments

    internalCommands.registerExternalCommand<MetricsAndParamsItem>(
      RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
      ({ dvcRoot, path }) =>
        this.experiments.getRepository(dvcRoot).toggleMetricOrParamStatus(path)
    )
  }

  public getRepositoryChildren(
    dvcRoot: string,
    path: string
  ): MetricsAndParamsItem[] {
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

        const splitPath = splitMetricOrParamPath(path)
        const label = splitPath[splitPath.length - 1]

        return { collapsibleState, description, dvcRoot, iconPath, label, path }
      })
  }

  public getRepositoryStatuses(dvcRoot: string) {
    return this.experiments.getRepository(dvcRoot).getMetricsAndParamsStatuses()
  }
}
