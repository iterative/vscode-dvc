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
      this.data.onDidUpdate(data => {
        this.model?.transformAndSetPlots(data)
        this.sendStaticPlots()
        this.sendComparisonPlots()
      })
    )

    this.handleMessageFromWebview()

    this.workspaceState = workspaceState
  }

  public async setExperiments(experiments: Experiments) {
    this.experiments = experiments

    this.model = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, this.workspaceState)
    )

    this.data.setModel(this.model)

    this.dispose.track(
      experiments.onDidChangeExperiments(async data => {
        if (data) {
          await this.model?.transformAndSetExperiments(data)
        }

        this.sendLivePlotsData()

        await this.data.isReady()
        this.data.setRevisions()
      })
    )

    await Promise.all([this.data.isReady(), this.experiments.isReady()])

    this.deferred.resolve()

    if (this.webview) {
      this.sendInitialWebviewData()
    }
  }

  public async sendInitialWebviewData() {
    await this.isReady()
    this.webview?.show({
      live: this.getLivePlots(),
      sectionCollapsed: this.model?.getSectionCollapsed(),
      static: this.getStaticPlots()
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

  private sendStaticPlots() {
    this.webview?.show({
      static: this.getStaticPlots()
    })
  }

  private prepareStaticPlots(
    data: PlotsOutput | undefined,
    onlyImages?: boolean
  ) {
    return Object.entries(data as PlotsOutput).reduce((acc, [path, plots]) => {
      if (!onlyImages || plots.some(plot => isImagePlot(plot))) {
        acc[path] = plots.map(plot =>
          isImagePlot(plot) ? this.getImagePlot(plot) : this.getVegaPlot(plot)
        )
      }
      return acc
    }, {} as PlotsOutput)
  }

  private getStaticPlots() {
    const data = this.model?.getPlotsDiff()
    if (isEmpty(data) || !this.model) {
      return null
    }

    return {
      plots: this.prepareStaticPlots(data),
      sectionName: this.model.getSectionName(Section.STATIC_PLOTS),
      size: this.model.getPlotSize(Section.STATIC_PLOTS)
    }
  }

  private sendComparisonPlots() {
    const data = this.model?.getPlotsDiff()

    const plots = this.prepareStaticPlots(data, true)
    const colors: Record<string, string> = {}

    Object.entries(plots).forEach(([, plots]) =>
      plots.forEach(plot => {
        const rev = plot.revisions?.[0]
        if (rev) {
          colors[rev] = '#ffffff'
        }
      })
    )

    this.webview?.show({
      comparison:
        (!isEmpty(data) &&
          this.model && {
            colors,
            plots,
            sectionName: this.model.getSectionName(Section.COMPARISON_TABLE),
            size: this.model.getPlotSize(Section.COMPARISON_TABLE)
          }) ||
        null
    })
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
