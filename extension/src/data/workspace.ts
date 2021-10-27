import { ExperimentsData } from '../experiments/data'
import { WorkspacePlots } from '../plots/workspace'
import { BaseWorkspace } from '../workspace'

export class WorkspaceData extends BaseWorkspace<ExperimentsData> {
  public create(dvcRoots: string[], workspacePlots: WorkspacePlots) {
    dvcRoots.forEach(dvcRoot => {
      const experimentsWatcher = this.dispose.track(
        new ExperimentsData(dvcRoot, this.internalCommands)
      )

      this.dispose.track(
        experimentsWatcher.onDidChangeData(data =>
          workspacePlots.update(dvcRoot, data)
        )
      )
      this.setRepository(dvcRoot, experimentsWatcher)
    })
  }

  public update(dvcRoot: string) {
    this.getRepository(dvcRoot).update()
  }
}
