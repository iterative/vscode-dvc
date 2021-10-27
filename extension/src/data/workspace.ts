import { ExperimentsWatcher } from '../experiments/watcher'
import { WorkspacePlots } from '../plots/workspace'
import { BaseWorkspace } from '../workspace'

export class WorkspaceData extends BaseWorkspace<ExperimentsWatcher> {
  public create(dvcRoots: string[], workspacePlots: WorkspacePlots) {
    dvcRoots.forEach(dvcRoot => {
      const experimentsWatcher = this.dispose.track(
        new ExperimentsWatcher(dvcRoot, this.internalCommands)
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
