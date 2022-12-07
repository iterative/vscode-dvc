import { Experiment, isRunning, RunningExperiment } from '../webview/contract'

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()
  public hasRunning: RunningExperiment[]

  constructor(workspace: Experiment | undefined) {
    if (workspace) {
      this.workspace = workspace
    }
    this.hasRunning = []
    if (isRunning(workspace?.status)) {
      this.hasRunning.push({ executor: 'workspace', id: 'workspace' })
    }
  }
}
