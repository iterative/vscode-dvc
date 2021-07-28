import { Experiment } from '../webview/contract'

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()

  constructor(workspace?: Experiment) {
    if (workspace) {
      this.workspace = workspace
    }
  }
}
