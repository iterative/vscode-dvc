import { Experiment } from '../webview/contract'

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()

  public branchColors: Map<string, string>
  public experimentColors: Map<string, string>

  constructor(
    workspace: Experiment | undefined,
    branchColors: Map<string, string>,
    experimentColors: Map<string, string>
  ) {
    if (workspace) {
      this.workspace = workspace
    }

    this.branchColors = branchColors
    this.experimentColors = experimentColors
  }
}
