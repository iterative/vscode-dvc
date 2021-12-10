import { EventEmitter, Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import {
  defaultSectionCollapsed,
  ImagePlot,
  isImagePlot,
  PlotsData as TPlotsData,
  PlotsOutput,
  SectionCollapsed
} from './webview/contract'
import { PlotsData } from './data'
import { PlotsModel } from './model'
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

export const enum MementoPrefixes {
  SECTION_COLLAPSED = 'sectionCollapsed:'
}

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  private experiments?: Experiments
  private model?: PlotsModel

  private readonly data: PlotsData
  private readonly workspaceState: Memento

  private sectionCollapsed: SectionCollapsed

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    webviewIcon: Resource,
    workspaceState: Memento
  ) {
    super(dvcRoot, webviewIcon)

    this.data = this.dispose.track(
      new PlotsData(dvcRoot, internalCommands, updatesPaused)
    )

    this.dispose.track(
      this.data.onDidUpdate(data => this.sendStaticPlots(data))
    )

    this.handleMessageFromWebview()

    this.sectionCollapsed = workspaceState.get(
      MementoPrefixes.SECTION_COLLAPSED + dvcRoot,
      defaultSectionCollapsed
    )

    this.workspaceState = workspaceState
  }

  public async setExperiments(experiments: Experiments) {
    this.experiments = experiments

    this.model = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, this.workspaceState)
    )

    this.dispose.track(
      experiments.onDidChangeExperiments(data => {
        if (data) {
          this.model?.transformAndSet(data)
        }
        this.sendLivePlotsData()
      })
    )

    await this.experiments.isReady()

    this.deferred.resolve()

    if (this.webview) {
      this.sendInitialWebviewData()
    }
  }

  public sendInitialWebviewData() {
    this.webview?.show({
      live: this.getLivePlots(),
      sectionCollapsed: this.sectionCollapsed
    })
    this.data.managedUpdate()
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
              this.model?.setSelectedMetrics(
                message.payload as MetricToggledPayload
              )
            )
          case MessageFromWebviewType.PLOTS_RESIZED:
            return (
              message.payload &&
              this.model?.setPlotSize(message.payload as PlotsResizedPayload)
            )
          case MessageFromWebviewType.PLOTS_SECTION_TOGGLED:
            return (
              message.payload && this.persistCollapsibleState(message.payload)
            )
          default:
            Logger.error(`Unexpected message: ${message}`)
        }
      })
    )
  }

  private persistCollapsibleState(newState: SectionCollapsed) {
    this.sectionCollapsed = {
      ...this.sectionCollapsed,
      ...newState
    }

    this.workspaceState.update(
      MementoPrefixes.SECTION_COLLAPSED + this.dvcRoot,
      this.sectionCollapsed
    )
  }
}
