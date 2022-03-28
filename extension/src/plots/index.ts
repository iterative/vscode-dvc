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

  public readonly onDidChangePaths: Event<void>

  private readonly pathsChanged = this.dispose.track(new EventEmitter<void>())

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
        this.notifyChanged()
      })
    )

    this.ensureTempDirRemoved()

    this.handleMessageFromWebview()

    this.workspaceState = workspaceState

    this.onDidChangePaths = this.pathsChanged.event
  }

  public setExperiments(experiments: Experiments) {
    this.plots = this.dispose.track(
      new PlotsModel(this.dvcRoot, experiments, this.workspaceState)
    )
    this.paths = this.dispose.track(
      new PathsModel(this.dvcRoot, this.workspaceState)
    )

    this.data.setModel(this.plots)

    this.waitForInitialData(experiments)

    if (this.webview) {
      this.sendInitialWebviewData()
    }
  }

  public async sendInitialWebviewData() {
    await this.isReady()
    this.webview?.show({
      checkpoint: this.getCheckpointPlots(),
      comparison: this.getComparisonPlots(),
      sectionCollapsed: this.plots?.getSectionCollapsed(),
      template: this.getTemplatePlots()
    })
  }

  public togglePathStatus(path: string) {
    const status = this.paths?.toggleStatus(path)
    this.paths?.setTemplateOrder()
    this.notifyChanged()
    return status
  }

  public getChildPaths(path: string) {
    return this.paths?.getChildren(path) || []
  }

  public getPathStatuses() {
    return this.paths?.getTerminalNodeStatuses() || []
  }

  private notifyChanged() {
    this.pathsChanged.fire()
    this.sendPlots()
  }

  private sendCheckpointPlotsData() {
    this.webview?.show({
      checkpoint: this.getCheckpointPlots()
    })
  }

  private getCheckpointPlots() {
    return this.plots?.getCheckpointPlots() || null
  }

  private async sendPlots() {
    if (definedAndNonEmpty(this.plots?.getMissingRevisions())) {
      this.sendCheckpointPlotsData()
      return this.data.managedUpdate()
    }

    await this.isReady()

    this.webview?.show({
      checkpoint: this.getCheckpointPlots(),
      comparison: this.getComparisonPlots(),
      template: this.getTemplatePlots()
    })
  }

  private getTemplatePlots() {
    const paths = this.paths?.getTemplateOrder()
    const plots = this.plots?.getTemplatePlots(paths)

    if (!this.plots || !plots || isEmpty(plots)) {
      return null
    }

    return {
      plots,
      sectionName: this.plots.getSectionName(Section.TEMPLATE_PLOTS),
      size: this.plots.getPlotSize(Section.TEMPLATE_PLOTS)
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
        return { path, revisions: this.getRevisionsWithCorrectUrls(revisions) }
      }),
      revisions: this.plots.getSelectedRevisionDetails(),
      sectionName: this.plots.getSectionName(Section.COMPARISON_TABLE),
      size: this.plots.getPlotSize(Section.COMPARISON_TABLE)
    }
  }

  private getRevisionsWithCorrectUrls(revisions: ComparisonRevisionData) {
    const acc: ComparisonRevisionData = {}

    for (const [revision, plot] of Object.entries(revisions)) {
      const updatedPlot = this.addCorrectUrl(plot)
      if (!updatedPlot) {
        continue
      }
      acc[revision] = updatedPlot
    }
    return acc
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
            return this.plots?.setSelectedMetrics(message.payload)
          case MessageFromWebviewType.PLOTS_RESIZED:
            return this.plots?.setPlotSize(
              message.payload.section,
              message.payload.size
            )
          case MessageFromWebviewType.PLOTS_SECTION_TOGGLED:
            return this.plots?.setSectionCollapsed(message.payload)
          case MessageFromWebviewType.SECTION_RENAMED:
            return this.plots?.setSectionName(
              message.payload.section,
              message.payload.name
            )
          case MessageFromWebviewType.PLOTS_COMPARISON_REORDERED:
            return this.plots?.setComparisonOrder(message.payload)
          case MessageFromWebviewType.PLOTS_TEMPLATES_REORDERED:
            return this.paths?.setTemplateOrder(message.payload)
          case MessageFromWebviewType.PLOTS_METRICS_REORDERED:
            return this.plots?.setMetricOrder(message.payload)
          default:
            Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
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

        this.plots?.setComparisonOrder()

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
