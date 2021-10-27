import { PlotsModel } from './model'
import { PlotsData } from './webview/contract'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { InternalCommands } from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

export type PlotsWebview = BaseWebview<PlotsData>

export class Plots extends BaseRepository<PlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  private plots: PlotsModel

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    super(dvcRoot, internalCommands, resourceLocator)

    this.plots = this.dispose.track(new PlotsModel())
    this.deferred.resolve()
  }

  public setState(data: ExperimentsRepoJSONOutput) {
    this.plots.transformAndSet(data)

    return this.sendData()
  }

  public getData() {
    return this.plots.getData()
  }
}
