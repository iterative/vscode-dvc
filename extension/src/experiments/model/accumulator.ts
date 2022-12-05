import { Experiment, isRunning } from '../webview/contract'

export class ExperimentsAccumulator {
  public workspace = {} as Experiment
  public branches: Experiment[] = []
  public checkpointsByTip: Map<string, Experiment[]> = new Map()
  public experimentsByBranch: Map<string, Experiment[]> = new Map()
  public hasRunning: { id: string; executor: string }[]

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
