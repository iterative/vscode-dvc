import { join } from 'path'
import { EventEmitter, Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import {
  ComparisonPlot,
  ComparisonRevisionData,
  PlotsData as TPlotsData,
  Section
} from './webview/contract'
import { PlotsData } from './data'
import { PlotsModel } from './model'
import { PathsModel } from './paths/model'
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
import { getModifiedTime, removeDir } from '../fileSystem'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  private plots?: PlotsModel
  private paths?: PathsModel

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
      this.data.onDidUpdate(async data => {
        await Promise.all([
          this.plots?.transformAndSetPlots(data),
          this.paths?.transformAndSet(data)
        ])
        this.sendPlots()
      })
    )

    this.ensureTempDirRemoved()

    this.handleMessageFromWebview()

    this.workspaceState = workspaceState
  }

  public setExperiments(experiments: Experiments) {
    this.plots = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, this.workspaceState)
    )
    this.paths = this.dispose.track(new PathsModel())

    this.data.setModel(this.plots)

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
      sectionCollapsed: this.plots?.getSectionCollapsed(),
      static: this.getStaticPlots()
    })
  }

  private sendLivePlotsData() {
    this.webview?.show({
      live: this.getLivePlots()
    })
  }

  private getLivePlots() {
    return this.plots?.getLivePlots() || null
  }

  private async sendPlots() {
    if (definedAndNonEmpty(this.plots?.getMissingRevisions())) {
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
    const paths = this.paths?.getVegaPaths()
    const staticPlots = this.plots?.getStaticPlots(paths)

    if (!this.plots || !staticPlots || isEmpty(staticPlots)) {
      return null
    }

    return {
      plots: staticPlots,
      sectionName: this.plots.getSectionName(Section.STATIC_PLOTS),
      size: this.plots.getPlotSize(Section.STATIC_PLOTS)
    }
  }

  private getComparisonPlots() {
    const paths = this.paths?.getComparisonPaths()
    const comparison = this.plots?.getComparisonPlots(paths)
    if (!this.plots || !comparison || isEmpty(comparison)) {
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
      revisions: this.plots.getSelectedRevisionDetails(),
      sectionName: this.plots.getSectionName(Section.COMPARISON_TABLE),
      size: this.plots.getPlotSize(Section.COMPARISON_TABLE)
    }
  }

  private addCorrectUrl(plot: ComparisonPlot) {
    if (this.webview) {
      return {
        ...plot,
        url: `${this.webview.getWebviewUri(plot.url)}?${getModifiedTime(
          plot.url
        )}`
      }
    }
  }

  private handleMessageFromWebview() {
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message => {
        switch (message.type) {
          case MessageFromWebviewType.METRIC_TOGGLED:
            return (
              message.payload && this.plots?.setSelectedMetrics(message.payload)
            )
          case MessageFromWebviewType.PLOTS_RESIZED:
            return (
              message.payload &&
              this.plots?.setPlotSize(
                message.payload.section,
                message.payload.size
              )
            )
          case MessageFromWebviewType.PLOTS_SECTION_TOGGLED:
            return (
              message.payload &&
              this.plots?.setSectionCollapsed(message.payload)
            )
          case MessageFromWebviewType.SECTION_RENAMED:
            return (
              message.payload &&
              this.plots?.setSectionName(
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
          await this.plots?.transformAndSetExperiments(data)
        }

        this.sendPlots()
      })
    )
  }

  private async initializeData(data: ExperimentsOutput) {
    await this.plots?.transformAndSetExperiments(data)
    this.data.managedUpdate()
    await Promise.all([
      this.data.isReady(),
      this.plots?.isReady(),
      this.paths?.isReady()
    ])
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
