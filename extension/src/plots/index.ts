import { join } from 'path'
import { Event, EventEmitter, Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import {
  ComparisonPlot,
  ComparisonRevisionData,
  PlotsData as TPlotsData,
  Section
} from './webview/contract'
import { PlotsData } from './data'
import { PlotsModel } from './model'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'
import { Resource } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { MessageFromWebviewType } from '../webview/contract'
import { Logger } from '../common/logger'
import { definedAndNonEmpty } from '../util/array'
import { ExperimentsOutput, TEMP_PLOTS_DIR } from '../cli/reader'
import { removeDir } from '../fileSystem'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  public readonly onDidChangePlots: Event<void>

  private model?: PlotsModel

  private readonly data: PlotsData
  private readonly workspaceState: Memento

  private readonly plotsChanged = this.dispose.track(new EventEmitter<void>())

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
      this.data.onDidUpdate(async data => {
        await this.model?.transformAndSetPlots(data)
        this.sendPlots()
      })
    )

    this.ensureTempDirRemoved()

    this.handleMessageFromWebview()

    this.workspaceState = workspaceState

    this.onDidChangePlots = this.plotsChanged.event
  }

  public setExperiments(experiments: Experiments) {
    this.model = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, this.workspaceState)
    )

    this.data.setModel(this.model)

    this.waitForInitialData(experiments)

    if (this.webview) {
      this.sendInitialWebviewData()
    }
  }

  public async sendInitialWebviewData() {
    await this.isReady()
    this.webview?.show({
      comparison: this.getComparisonPlots(),
      live: this.getLivePlots(),
      sectionCollapsed: this.model?.getSectionCollapsed(),
      static: this.getStaticPlots()
    })
  }

  public toggleRevisionStatus(id: string) {
    const status = this.model?.toggleStatus(id)
    this.notifyChanged()
    return status
  }

  public getRevisions() {
    return this.model?.getRevisions() || []
  }

  private notifyChanged() {
    this.plotsChanged.fire()
    this.sendInitialWebviewData()
  }

  private sendLivePlotsData() {
    this.webview?.show({
      live: this.getLivePlots()
    })
  }

  private getLivePlots() {
    return this.model?.getLivePlots() || null
  }

  private async sendPlots() {
    if (definedAndNonEmpty(this.model?.getMissingRevisions())) {
      this.sendLivePlotsData()
      return this.data.managedUpdate()
    }

    await this.isReady()

    this.webview?.show({
      comparison: this.getComparisonPlots(),
      live: this.getLivePlots(),
      static: this.getStaticPlots()
    })
  }

  private getStaticPlots() {
    const staticPlots = this.model?.getStaticPlots()

    if (!this.model || !staticPlots || isEmpty(staticPlots)) {
      return null
    }

    return {
      plots: staticPlots,
      sectionName: this.model.getSectionName(Section.STATIC_PLOTS),
      size: this.model.getPlotSize(Section.STATIC_PLOTS)
    }
  }

  private getComparisonPlots() {
    const comparison = this.model?.getComparisonPlots()
    if (!this.model || !comparison || isEmpty(comparison)) {
      return null
    }

    return {
      plots: comparison.map(({ path, revisions }) => {
        const revisionsWithCorrectUrls = Object.entries(revisions).reduce(
          (acc, [revision, plot]) => {
            const updatedPlot = this.addCorrectUrl(plot)
            if (updatedPlot) {
              acc[revision] = updatedPlot
            }
            return acc
          },
          {} as ComparisonRevisionData
        )
        return { path, revisions: revisionsWithCorrectUrls }
      }),
      revisions: this.model.getComparisonRevisions(),
      sectionName: this.model.getSectionName(Section.COMPARISON_TABLE),
      size: this.model.getPlotSize(Section.COMPARISON_TABLE)
    }
  }

  private addCorrectUrl(plot: ComparisonPlot) {
    if (this.webview) {
      return {
        ...plot,
        url: this.webview.getWebviewUri(plot.url)
      }
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

  private waitForInitialData(experiments: Experiments) {
    const waitForInitialExpData = this.dispose.track(
      experiments.onDidChangeExperiments(data => {
        if (data) {
          this.dispose.untrack(waitForInitialExpData)
          waitForInitialExpData.dispose()
          this.setupExperimentsListener(experiments)
          this.initializeData(data)
        }
      })
    )
  }

  private setupExperimentsListener(experiments: Experiments) {
    this.dispose.track(
      experiments.onDidChangeExperiments(async data => {
        if (data) {
          await this.model?.transformAndSetExperiments(data)
        }

        this.sendPlots()
      })
    )
  }

  private async initializeData(data: ExperimentsOutput) {
    await this.model?.transformAndSetExperiments(data)
    this.data.managedUpdate()
    await Promise.all([this.data.isReady(), this.model?.isReady()])
    this.deferred.resolve()
  }

  private ensureTempDirRemoved() {
    this.dispose.track({
      dispose: () => {
        const tempDir = join(this.dvcRoot, TEMP_PLOTS_DIR)
        return removeDir(tempDir)
      }
    })
  }
}
