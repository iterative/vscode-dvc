import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import { Experiment, isRunning, RunningExperiment } from '../webview/contract'

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()
  public runningExperiments: RunningExperiment[]

  constructor(workspace: Experiment | undefined) {
    if (workspace) {
      this.workspace = workspace
    }
    this.runningExperiments = []
    if (isRunning(workspace?.status)) {
      this.runningExperiments.push({
        executor: EXPERIMENT_WORKSPACE_ID,
        id: EXPERIMENT_WORKSPACE_ID
      })
    }
  }
}
