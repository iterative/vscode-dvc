import { Disposable } from '@hediet/std/disposable'
import { Data } from '.'
import { InternalCommands } from '../commands/internal'
import { WorkspaceExperiments } from '../experiments/workspace'
import { reset } from '../util/disposable'

export class WorkspaceData {
  public readonly dispose = Disposable.fn()

  private data: Record<string, Data> = {}

  private internalCommands: InternalCommands

  constructor(internalCommands: InternalCommands) {
    this.internalCommands = internalCommands
  }

  public create(
    dvcRoots: string[],
    workspaceExperiments: WorkspaceExperiments
  ) {
    dvcRoots.forEach(dvcRoot => {
      const data = this.dispose.track(new Data(dvcRoot, this.internalCommands))
      this.dispose.track(
        data.onDidChangeExperimentsData(data =>
          workspaceExperiments.update(dvcRoot, data)
        )
      )
      this.data[dvcRoot] = data
    })
  }

  public reset() {
    this.data = reset<Data>(this.data, this.dispose)
  }

  public refresh(dvcRoot: string) {
    this.data[dvcRoot].refresh()
  }
}
