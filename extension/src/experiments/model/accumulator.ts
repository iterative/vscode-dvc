import { Experiment } from '../webview/contract'

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()

  public hasCheckpoints: boolean

  constructor(workspace: Experiment | undefined, hasCheckpoints: boolean) {
    if (workspace) {
      this.workspace = workspace
    }

    this.hasCheckpoints = hasCheckpoints
  }
}
