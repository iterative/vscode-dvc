import { Experiment } from '../webview/contract'

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()
  public hasRunning: boolean

  constructor(workspace: Experiment | undefined) {
    if (workspace) {
      this.workspace = workspace
    }
    this.hasRunning = !!workspace?.running
  }
}
