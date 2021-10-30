import { Disposable } from '@hediet/std/disposable'
import { collectLivePlotsData, LivePlotAccumulator } from './collect'
import { PlotsData } from './webview/contract'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

export class PlotsModel {
  public dispose = Disposable.fn()

  private data?: LivePlotAccumulator

  public transformAndSet(data: ExperimentsRepoJSONOutput) {
    this.data = collectLivePlotsData(data)
  }

  public getData() {
    const plotsData: PlotsData = []

    this.data?.forEach((value, key) => {
      plotsData.push({ title: key, values: value })
    })

    return plotsData
  }
}
