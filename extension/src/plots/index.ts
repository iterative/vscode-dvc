import { join } from 'path'
import { Event, EventEmitter, Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import {
  ComparisonPlot,
  ComparisonRevisionData,
  PlotsData as TPlotsData,
  PlotSize,
  Section,
  SectionCollapsed
} from './webview/contract'
import { PlotsData } from './data'
import { PlotsModel } from './model'
import { collectScale } from './paths/collect'
import { PathsModel } from './paths/model'
import { BaseWebview } from '../webview'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Experiments } from '../experiments'
import { Resource } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import {
  MessageFromWebviewType,
  PlotsTemplatesReordered
} from '../webview/contract'
import { Logger } from '../common/logger'
import { definedAndNonEmpty } from '../util/array'
import { ExperimentsOutput, TEMP_PLOTS_DIR } from '../cli/reader'
import { getModifiedTime, removeDir } from '../fileSystem'
import { sendTelemetryEvent } from '../telemetry'
import { EventName } from '../telemetry/constants'
import { Toast } from '../vscode/toast'
import { pickPaths } from '../path/selection/quickPick'

export type PlotsWebview = BaseWebview<TPlotsData>

export class Plots extends BaseRepository<TPlotsData> {
  public readonly viewKey = ViewKey.PLOTS

  public readonly onDidChangePaths: Event<void>

  private readonly pathsChanged = this.dispose.track(new EventEmitter<void>())

  private experiments?: Experiments

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
      this.data.onDidUpdate(async ({ data, revs }) => {
        await Promise.all([
          this.plots?.transformAndSetPlots(data, revs),
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
    this.experiments = experiments

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

  public sendInitialWebviewData() {
    return this.fetchMissingOrSendPlots()
  }

  public togglePathStatus(path: string) {
    const status = this.paths?.toggleStatus(path)
    this.paths?.setTemplateOrder()
    this.notifyChanged()
    return status
  }

  public async selectPlots() {
    const paths = this.paths?.getTerminalNodes()

    const selected = await pickPaths('plots', paths)
    if (!selected) {
      return
    }

    this.paths?.setSelected(selected)
    this.paths?.setTemplateOrder()
    return this.notifyChanged()
  }

  public getChildPaths(path: string) {
    return this.paths?.getChildren(path) || []
  }

  public getPathStatuses() {
    return this.paths?.getTerminalNodeStatuses() || []
  }

  public getScale() {
    return collectScale(this.paths?.getTerminalNodes())
  }

  private notifyChanged() {
    this.pathsChanged.fire()
    this.fetchMissingOrSendPlots()
  }

  private sendCheckpointPlotsData() {
    this.webview?.show({
      checkpoint: this.getCheckpointPlots()
    })
  }

  private getCheckpointPlots() {
    return this.plots?.getCheckpointPlots() || null
  }

  private async fetchMissingOrSendPlots() {
    await this.isReady()

    if (
      this.paths?.hasPaths() &&
      definedAndNonEmpty(this.plots?.getUnfetchedRevisions())
    ) {
      this.sendCheckpointPlotsData()
      return this.data.managedUpdate()
    }

    return this.sendPlots()
  }

  private sendPlots() {
    this.webview?.show({
      checkpoint: this.getCheckpointPlots(),
      comparison: this.getComparisonPlots(),
      hasPlots: !!this.paths?.hasPaths(),
      hasSelectedPlots: definedAndNonEmpty(this.paths?.getSelected()),
      sectionCollapsed: this.plots?.getSectionCollapsed(),
      selectedRevisions: this.plots?.getSelectedRevisionDetails(),
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
        url: plot.url
          ? `${this.webview.getWebviewUri(plot.url)}?${getModifiedTime(
              plot.url
            )}`
          : undefined
      }
    }
  }

  private handleMessageFromWebview() {
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message => {
        switch (message.type) {
          case MessageFromWebviewType.TOGGLE_METRIC:
            return this.setSelectedMetrics(message.payload)
          case MessageFromWebviewType.RESIZE_PLOTS:
            return this.setPlotSize(
              message.payload.section,
              message.payload.size
            )
          case MessageFromWebviewType.TOGGLE_PLOTS_SECTION:
            return this.setSectionCollapsed(message.payload)
          case MessageFromWebviewType.REORDER_PLOTS_COMPARISON:
            return this.setComparisonOrder(message.payload)
          case MessageFromWebviewType.REORDER_PLOTS_TEMPLATES:
            return this.setTemplateOrder(message.payload)
          case MessageFromWebviewType.REORDER_PLOTS_METRICS:
            return this.setMetricOrder(message.payload)
          case MessageFromWebviewType.SELECT_PLOTS:
            return this.selectPlotsFromWebview()
          case MessageFromWebviewType.SELECT_EXPERIMENTS:
            return this.selectExperimentsFromWebview()
          case MessageFromWebviewType.REFRESH_REVISION:
            return this.attemptToRefreshRevData(message.payload)
          case MessageFromWebviewType.REFRESH_REVISIONS:
            return this.attemptToRefreshSelectedData(message.payload)
          case MessageFromWebviewType.TOGGLE_EXPERIMENT:
            return this.setExperimentStatus(message.payload)
          default:
            Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
        }
      })
    )
  }

  private setSelectedMetrics(metrics: string[]) {
    this.plots?.setSelectedMetrics(metrics)
    this.sendCheckpointPlotsAndEvent(EventName.VIEWS_PLOTS_METRICS_SELECTED)
  }

  private setPlotSize(section: Section, size: PlotSize) {
    this.plots?.setPlotSize(section, size)
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SECTION_RESIZED,
      { section, size },
      undefined
    )
  }

  private setSectionCollapsed(collapsed: Partial<SectionCollapsed>) {
    this.plots?.setSectionCollapsed(collapsed)
    this.webview?.show({
      sectionCollapsed: this.plots?.getSectionCollapsed()
    })
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SECTION_TOGGLE,
      collapsed,
      undefined
    )
  }

  private setComparisonOrder(order: string[]) {
    this.plots?.setComparisonOrder(order)
    this.webview?.show({
      comparison: this.getComparisonPlots(),
      selectedRevisions: this.plots?.getSelectedRevisionDetails()
    })
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_REVISIONS_REORDERED,
      undefined,
      undefined
    )
  }

  private setTemplateOrder(order: PlotsTemplatesReordered) {
    this.paths?.setTemplateOrder(order)
    this.webview?.show({
      template: this.getTemplatePlots()
    })
    sendTelemetryEvent(
      EventName.VIEWS_REORDER_PLOTS_TEMPLATES,
      undefined,
      undefined
    )
  }

  private setMetricOrder(order: string[]) {
    this.plots?.setMetricOrder(order)
    this.sendCheckpointPlotsAndEvent(EventName.VIEWS_REORDER_PLOTS_METRICS)
  }

  private selectPlotsFromWebview() {
    this.selectPlots()
    sendTelemetryEvent(EventName.VIEWS_PLOTS_SELECT_PLOTS, undefined, undefined)
  }

  private selectExperimentsFromWebview() {
    this.experiments?.selectExperiments()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SELECT_EXPERIMENTS,
      undefined,
      undefined
    )
  }

  private setExperimentStatus(id: string) {
    this.experiments?.toggleExperimentStatus(id)
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_EXPERIMENT_TOGGLE,
      undefined,
      undefined
    )
  }

  private attemptToRefreshRevData(revision: string) {
    Toast.infoWithOptions(`Attempting to refresh plots data for ${revision}.`)
    this.plots?.setupManualRefresh(revision)
    this.data.managedUpdate()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_MANUAL_REFRESH,
      { revisions: 1 },
      undefined
    )
  }

  private attemptToRefreshSelectedData(revisions: string[]) {
    Toast.infoWithOptions('Attempting to refresh visible plots data.')
    for (const revision of revisions) {
      this.plots?.setupManualRefresh(revision)
    }
    this.data.managedUpdate()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_MANUAL_REFRESH,
      { revisions: revisions.length },
      undefined
    )
  }

  private sendCheckpointPlotsAndEvent(
    event:
      | typeof EventName.VIEWS_REORDER_PLOTS_METRICS
      | typeof EventName.VIEWS_PLOTS_METRICS_SELECTED
  ) {
    this.sendCheckpointPlotsData()
    sendTelemetryEvent(event, undefined, undefined)
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

        this.fetchMissingOrSendPlots()
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
