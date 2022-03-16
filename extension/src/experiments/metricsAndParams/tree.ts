import {
  BasePathSelectionTree,
  PathSelectionItem
} from '../../path/selection/tree'
import { WorkspaceExperiments } from '../workspace'
import { ResourceLocator } from '../../resourceLocator'
import { RegisteredCommands } from '../../commands/external'
import { EventName } from '../../telemetry/constants'
import { InternalCommands } from '../../commands/internal'

export class ExperimentsMetricsAndParamsTree extends BasePathSelectionTree<WorkspaceExperiments> {
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

    internalCommands.registerExternalCommand<PathSelectionItem>(
      RegisteredCommands.EXPERIMENT_METRICS_AND_PARAMS_TOGGLE,
      ({ dvcRoot, path }) =>
        this.workspace.getRepository(dvcRoot).toggleMetricOrParamStatus(path)
    )
  }

  public getRepositoryChildren(dvcRoot: string, path: string) {
    return this.workspace.getRepository(dvcRoot).getChildMetricsOrParams(path)
  }

  public getRepositoryStatuses(dvcRoot: string) {
    return this.workspace.getRepository(dvcRoot).getMetricsAndParamsStatuses()
  }
}
