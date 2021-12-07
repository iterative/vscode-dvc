import { EventEmitter } from 'vscode'
import isEmpty from 'lodash.isempty'
import {
  ImagePlot,
  isImagePlot,
  PlotsData as TPlotsData,
  PlotsOutput
} from './webview/contract'
import { PlotsData } from './data'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'
import { Resource } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import {
  MessageFromWebviewType,
  MetricToggledPayload
} from '../webview/contract'
import { Logger } from '../common/logger'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  private experiments?: Experiments

  private readonly data: PlotsData
  private staticPlots?: PlotsOutput

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    webviewIcon: Resource
  ) {
    super(dvcRoot, webviewIcon)

    this.data = this.dispose.track(
      new PlotsData(dvcRoot, internalCommands, updatesPaused)
    )

    this.dispose.track(
      this.data.onDidUpdate(data => this.setOrSendStaticPlots(data))
    )

    this.handleMessageFromWebview()
  }

  public async setExperiments(experiments: Experiments) {
    this.experiments = experiments

    await this.experiments.isReady()

    this.dispose.track(
      experiments.onDidChangeLivePlots(() => {
        if (this.webview) {
          this.webview.show({
            live: this.getLivePlots()
          })
        }
      })
    )

    this.deferred.resolve()
    return this.sendWebviewData()
  }

  public getWebviewData() {
    return {
      live: this.getLivePlots(),
      static: this.getStaticPlots(this.staticPlots)
    }
  }

  private getLivePlots() {
    return this.experiments?.getLivePlots() || null
  }

  private setOrSendStaticPlots(data: PlotsOutput) {
    if (this.webview) {
      return this.sendStaticPlots(data)
    }

    this.staticPlots = isEmpty(data) ? undefined : data
  }

  private sendStaticPlots(data: PlotsOutput) {
    this.staticPlots = undefined
    this.webview?.show({
      static: this.getStaticPlots(data)
    })
  }

  private getStaticPlots(data: PlotsOutput | undefined) {
    if (isEmpty(data)) {
      return null
    }

    return Object.entries(data as PlotsOutput).reduce((acc, [path, plots]) => {
      acc[path] = plots.map(plot =>
        isImagePlot(plot)
          ? ({
              ...plot,
              url: this.webview?.getWebviewUri(plot.url)
            } as ImagePlot)
          : plot
      )
      return acc
    }, {} as PlotsOutput)
  }

  private handleMessageFromWebview() {
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message => {
        if (message.type === MessageFromWebviewType.METRIC_TOGGLED) {
          return (
            message.payload &&
            this.experiments?.setSelectedMetrics(
              message.payload as MetricToggledPayload
            )
          )
        }

        Logger.error(`Unexpected message: ${message}`)
      })
    )
  }
}
