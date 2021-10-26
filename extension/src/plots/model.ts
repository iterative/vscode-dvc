import { Disposable } from '@hediet/std/disposable'
import { collectLivePlots, LivePlotAccumulator } from './collect'
import { PlotsData } from './webview/contract'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

export class PlotsModel {
  public dispose = Disposable.fn()

  private data?: LivePlotAccumulator

  public transformAndSet(data: ExperimentsRepoJSONOutput) {
    this.data = collectLivePlots(data)
  }

  public getData() {
    const plotsData: PlotsData = []

    this.data?.forEach((value, key) => {
      plotsData.push({ title: key, values: value })
    })

    return plotsData
  }
}
