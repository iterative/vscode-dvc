import { Event, EventEmitter } from 'vscode'
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
  public readonly onDidChangePlots: Event<void>

  public readonly viewKey = ViewKey.PLOTS

  private plots: PlotsModel

  private readonly plotsChanged = new EventEmitter<void>()

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    super(dvcRoot, internalCommands, resourceLocator)

    this.onDidChangePlots = this.plotsChanged.event

    this.plots = this.dispose.track(new PlotsModel())

    this.deferred.resolve()
  }

  public setState(data: ExperimentsRepoJSONOutput) {
    this.plots.transformAndSet(data)

    return this.notifyChanged()
  }

  public getData() {
    return this.plots.getData()
  }

  private notifyChanged() {
    this.plotsChanged.fire()
  }
}
