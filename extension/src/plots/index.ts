import { EventEmitter } from 'vscode'
import { PlotsData } from './webview/contract'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { InternalCommands } from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { Experiments } from '../experiments'

export type PlotsWebview = BaseWebview<PlotsData>

export class Plots extends BaseRepository<PlotsData> {
  public readonly viewKey = ViewKey.PLOTS
  public readonly dataUpdated = this.dispose.track(new EventEmitter<void>())

  private readonly onDidUpdateData = this.dataUpdated.event
  private experiments?: Experiments

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    super(dvcRoot, internalCommands, resourceLocator)

    this.dispose.track(
      this.onDidUpdateData(() => {
        this.notifyChanged()
      })
    )
  }

  public setExperiments(experiments: Experiments) {
    this.experiments = experiments
    this.deferred.resolve()
    return this.notifyChanged()
  }

  public getData() {
    return this.experiments?.getLivePlots() || []
  }

  private notifyChanged() {
    this.dataUpdated.fire()
    return this.sendData()
  }
}
