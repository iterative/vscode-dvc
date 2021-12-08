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
  MetricToggledPayload,
  PlotsResizedPayload
} from '../webview/contract'
import { Logger } from '../common/logger'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  private experiments?: Experiments

  private readonly data: PlotsData

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
      this.data.onDidUpdate(data => this.sendStaticPlots(data))
    )

    this.handleMessageFromWebview()
  }

  public async setExperiments(experiments: Experiments) {
    this.experiments = experiments

    await this.experiments.isReady()

    this.dispose.track(
      experiments.onDidChangeLivePlots(() => {
        this.sendLivePlotsData()
      })
    )

    this.deferred.resolve()

    if (this.webview) {
      this.sendInitialWebviewData()
    }
  }

  public sendInitialWebviewData() {
    this.sendLivePlotsData()
    this.data.managedUpdate()
  }

  public getWebviewData() {
    return {}
  }

  private sendLivePlotsData() {
    this.webview?.show({
      live: this.experiments?.getLivePlots() || null
    })
  }

  private sendStaticPlots(data: PlotsOutput) {
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
        switch (message.type) {
          case MessageFromWebviewType.METRIC_TOGGLED:
            return (
              message.payload &&
              this.experiments?.setSelectedMetrics(
                message.payload as MetricToggledPayload
              )
            )
          case MessageFromWebviewType.PLOTS_RESIZED:
            return (
              message.payload &&
              this.experiments?.setPlotSize(
                message.payload as PlotsResizedPayload
              )
            )
          default:
            Logger.error(`Unexpected message: ${message}`)
        }
      })
    )
  }
}
