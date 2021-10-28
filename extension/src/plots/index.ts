import { EventEmitter } from 'vscode'
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

  private readonly dataUpdated = this.dispose.track(new EventEmitter<void>())
  private readonly onDidUpdateData = this.dataUpdated.event

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    super(dvcRoot, internalCommands, resourceLocator)

    this.plots = this.dispose.track(new PlotsModel())

    const waitForInitialData = this.dispose.track(
      this.onDidUpdateData(() => {
        this.deferred.resolve()
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
      })
    )
  }

  public setState(data: ExperimentsRepoJSONOutput) {
    this.plots.transformAndSet(data)

    return this.notifyChanged()
  }

  public getData() {
    return this.plots.getData()
  }

  private notifyChanged() {
    this.dataUpdated.fire()
    return this.sendData()
  }
}
