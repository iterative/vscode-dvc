import isEmpty from 'lodash.isempty'
import { PlotsData as TPlotsData } from './webview/contract'
import { PlotsData } from './data'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'
import { Resource } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { PlotsOutput } from '../cli/reader'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  private experiments?: Experiments

  private data: PlotsData
  private staticPlots?: PlotsOutput

  private hiddenMetrics: Set<string> = new Set()

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    webviewIcon: Resource
  ) {
    super(dvcRoot, internalCommands, webviewIcon)

    this.data = this.dispose.track(new PlotsData(dvcRoot, internalCommands))

    this.dispose.track(this.data.onDidUpdate(data => this.setStaticPlots(data)))
  }

  public isMetricHidden(metricId: string) {
    return this.hiddenMetrics.has(metricId)
  }

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

  public hideMetric(metricId: string) {
    this.hiddenMetrics.add(metricId)
    this.notifyChanged()
    this.experiments?.updateParamsAndMetricsTree()
  }

  public unhideMetric(metricId: string) {
    this.hiddenMetrics.delete(metricId)
    this.notifyChanged()
    this.experiments?.updateParamsAndMetricsTree()
  }

  public clearHiddenMetrics() {
    this.hiddenMetrics.clear()
    this.notifyChanged()
    this.experiments?.updateParamsAndMetricsTree()
  }

  public getWebviewData() {
    return {
      live: this.experiments?.getLivePlots(this.hiddenMetrics),
      static: this.staticPlots
    }
  }

  private notifyChanged() {
    return this.sendWebviewData()
  }

  private setStaticPlots(data: PlotsOutput) {
    if (isEmpty(data)) {
      this.staticPlots = undefined
      return
    }

    this.staticPlots = data
  }
}
