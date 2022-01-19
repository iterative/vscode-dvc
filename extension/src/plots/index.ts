import { TopLevelSpec } from 'vega-lite'
import { EventEmitter, Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import {
  ImagePlot,
  isImagePlot,
  PlotsData as TPlotsData,
  PlotsOutput,
  Section,
  VegaPlot
} from './webview/contract'
import { PlotsData } from './data'
import { PlotsModel } from './model'
import { extendVegaSpec } from './vega/util'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'
import { Resource } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { MessageFromWebviewType } from '../webview/contract'
import { Logger } from '../common/logger'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  private experiments?: Experiments
  private model?: PlotsModel

  private readonly data: PlotsData
  private readonly workspaceState: Memento

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    webviewIcon: Resource,
    workspaceState: Memento,
    data?: PlotsData
  ) {
    super(dvcRoot, webviewIcon)

    this.data = this.dispose.track(
      data || new PlotsData(dvcRoot, internalCommands, updatesPaused)
    )

    this.dispose.track(
      this.data.onDidUpdate(data => this.sendStaticPlots(data))
    )

    this.handleMessageFromWebview()

    this.workspaceState = workspaceState
  }

  public async setExperiments(experiments: Experiments) {
    this.experiments = experiments

    this.model = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, this.workspaceState)
    )

    this.dispose.track(
      experiments.onDidChangeExperiments(async data => {
        if (data) {
          await this.model?.transformAndSet(data)
        }

        this.sendLivePlotsData()

        await this.data.isReady()
        this.data.setRevisions(...(this.model?.getRevisions() || []))
      })
    )

    await this.experiments.isReady()

    this.deferred.resolve()

    if (this.webview) {
      this.sendInitialWebviewData()
    }
  }

  public async sendInitialWebviewData() {
    this.data.clearRevisions()
    this.data.setRevisions(...(this.model?.getRevisions() || []))

    const initialStaticPlotMessage = new Promise(resolve => {
      const listener = this.dispose.track(
        this.data.onDidUpdate(() => {
          this.dispose.untrack(listener)
          listener.dispose()
          resolve(undefined)
        })
      )
    })

    await initialStaticPlotMessage

    this.webview?.show({
      live: this.getLivePlots(),
      sectionCollapsed: this.model?.getSectionCollapsed()
    })
  }

  private sendLivePlotsData() {
    this.webview?.show({
      live: this.getLivePlots()
    })
  }

  private getLivePlots() {
    return this.model?.getLivePlots() || null
  }

  private sendStaticPlots(data: PlotsOutput) {
    this.webview?.show({
      static: this.getStaticPlots(data)
    })
  }

  private getStaticPlots(data: PlotsOutput | undefined) {
    if (isEmpty(data) || !this.model) {
      return null
    }

    const plots = Object.entries(data as PlotsOutput).reduce(
      (acc, [path, plots]) => {
        acc[path] = plots.map(plot =>
          isImagePlot(plot) ? this.getImagePlot(plot) : this.getVegaPlot(plot)
        )
        return acc
      },
      {} as PlotsOutput
    )

    return {
      plots,
      sectionName: this.model.getSectionName(Section.STATIC_PLOTS),
      size: this.model.getPlotSize(Section.STATIC_PLOTS)
    }
  }

  private getImagePlot(plot: ImagePlot) {
    return {
      ...plot,
      url: this.webview?.getWebviewUri(plot.url)
    } as ImagePlot
  }

  private getVegaPlot(plot: VegaPlot) {
    return {
      ...plot,
      content: extendVegaSpec(
        plot.content as TopLevelSpec,
        this.model?.getRevisionColors()
      )
    }
  }

  private handleMessageFromWebview() {
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message => {
        switch (message.type) {
          case MessageFromWebviewType.METRIC_TOGGLED:
            return (
              message.payload && this.model?.setSelectedMetrics(message.payload)
            )
          case MessageFromWebviewType.PLOTS_RESIZED:
            return (
              message.payload &&
              this.model?.setPlotSize(
                message.payload.section,
                message.payload.size
              )
            )
          case MessageFromWebviewType.PLOTS_SECTION_TOGGLED:
            return (
              message.payload &&
              this.model?.setSectionCollapsed(message.payload)
            )
          case MessageFromWebviewType.SECTION_RENAMED:
            return (
              message.payload &&
              this.model?.setSectionName(
                message.payload.section,
                message.payload.name
              )
            )
          default:
            Logger.error(`Unexpected message: ${message}`)
        }
      })
    )
  }
}
