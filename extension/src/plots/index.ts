import { PlotsData } from './webview/contract'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'

export type PlotsWebview = BaseWebview<PlotsData>

export class Plots extends BaseRepository<PlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  private experiments?: Experiments

  public async setExperiments(experiments: Experiments) {
    this.experiments = experiments

    await this.experiments.isReady()

    this.dispose.track(
      experiments.onDidChangeLivePlots(() => {
        this.notifyChanged()
      })
    )

    this.deferred.resolve()
    return this.notifyChanged()
  }

  public getData() {
    return this.experiments?.getLivePlots() || []
  }

  private notifyChanged() {
    return this.sendData()
  }
}
