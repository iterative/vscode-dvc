import { Disposable } from '@hediet/std/disposable'
import { Data } from '.'
import { InternalCommands } from '../commands/internal'
import { WorkspaceExperiments } from '../experiments/workspace'

export class WorkspaceData {
  public readonly dispose = Disposable.fn()

  private data: Record<string, Data> = {}

  constructor(
    dvcRoots: string[],
    internalCommands: InternalCommands,
    workspaceExperiments: WorkspaceExperiments
  ) {
    // and workspacePlots

    dvcRoots.forEach(dvcRoot => {
      const data = this.dispose.track(new Data(dvcRoot, internalCommands))
      this.dispose.track(
        data.onDidChangeExperimentsData(data =>
          workspaceExperiments.update(dvcRoot, data)
        )
      )
      this.data[dvcRoot] = data
    })
  }

  public refreshData(dvcRoot: string) {
    this.data[dvcRoot].refresh()
  }
}
