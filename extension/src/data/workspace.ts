import { Data } from '.'
import { WorkspaceExperiments } from '../experiments/workspace'
import { WorkspacePlots } from '../plots/workspace'
import { BaseWorkspace } from '../workspace'

export class WorkspaceData extends BaseWorkspace<Data> {
  public create(
    dvcRoots: string[],
    workspaceExperiments: WorkspaceExperiments,
    workspacePlots: WorkspacePlots
  ) {
    dvcRoots.forEach(dvcRoot => {
      const data = this.dispose.track(new Data(dvcRoot, this.internalCommands))
      this.dispose.track(
        data.onDidChangeExperimentsData(data =>
          workspaceExperiments.update(dvcRoot, data)
        )
      )
      this.dispose.track(
        data.onDidChangeExperimentsData(data =>
          workspacePlots.update(dvcRoot, data)
        )
      )
      this.setRepository(dvcRoot, data)
    })
  }

  public update(dvcRoot: string) {
    this.getRepository(dvcRoot).update()
  }
}
