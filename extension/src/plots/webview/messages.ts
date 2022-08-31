import isEmpty from 'lodash.isempty'
import {
  ComparisonPlot,
  ComparisonRevisionData,
  PlotsData as TPlotsData,
  PlotSize,
  Section,
  SectionCollapsed
} from './contract'
import { Logger } from '../../common/logger'
import { Experiments } from '../../experiments'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { Toast } from '../../vscode/toast'
import {
  MessageFromWebview,
  MessageFromWebviewType,
  PlotsTemplatesReordered
} from '../../webview/contract'
import { PlotsModel } from '../model'
import { PathsModel } from '../paths/model'
import { BaseWebview } from '../../webview'
import { getModifiedTime } from '../../fileSystem'
import { definedAndNonEmpty } from '../../util/array'

export class WebviewMessages {
  private readonly paths: PathsModel
  private readonly plots: PlotsModel
  private readonly experiments: Experiments

  private readonly getWebview: () => BaseWebview<TPlotsData> | undefined
  private readonly selectPlots: () => void
  private readonly updateData: () => void

  constructor(
    paths: PathsModel,
    plots: PlotsModel,
    experiments: Experiments,
    getWebview: () => BaseWebview<TPlotsData> | undefined,
    selectPlots: () => void,
    updateData: () => void
  ) {
    this.paths = paths
    this.plots = plots
    this.experiments = experiments
    this.getWebview = getWebview
    this.selectPlots = selectPlots
    this.updateData = updateData
  }

  public sendWebviewMessage() {
    this.getWebview()?.show({
      checkpoint: this.getCheckpointPlots(),
      comparison: this.getComparisonPlots(),
      hasPlots: !!this.paths?.hasPaths(),
      hasSelectedPlots: definedAndNonEmpty(this.paths.getSelected()),
      sectionCollapsed: this.plots.getSectionCollapsed(),
      selectedRevisions: this.plots.getSelectedRevisionDetails(),
      template: this.getTemplatePlots()
    })
  }

  public sendCheckpointPlotsMessage() {
    this.getWebview()?.show({
      checkpoint: this.getCheckpointPlots()
    })
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.TOGGLE_METRIC:
        return this.setSelectedMetrics(message.payload)
      case MessageFromWebviewType.RESIZE_PLOTS:
        return this.setPlotSize(message.payload.section, message.payload.size)
      case MessageFromWebviewType.TOGGLE_PLOTS_SECTION:
        return this.setSectionCollapsed(message.payload)
      case MessageFromWebviewType.REORDER_PLOTS_COMPARISON:
        return this.setComparisonOrder(message.payload)
      case MessageFromWebviewType.REORDER_PLOTS_COMPARISON_ROWS:
        return this.setComparisonRowsOrder(message.payload)
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
  }

  private setSelectedMetrics(metrics: string[]) {
    this.plots.setSelectedMetrics(metrics)
    this.sendCheckpointPlotsAndEvent(EventName.VIEWS_PLOTS_METRICS_SELECTED)
  }

  private setPlotSize(section: Section, size: PlotSize) {
    this.plots.setPlotSize(section, size)
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SECTION_RESIZED,
      { section, size },
      undefined
    )
  }

  private setSectionCollapsed(collapsed: Partial<SectionCollapsed>) {
    this.plots.setSectionCollapsed(collapsed)
    this.sendSectionCollapsed()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SECTION_TOGGLE,
      collapsed,
      undefined
    )
  }

  private setComparisonOrder(order: string[]) {
    this.plots.setComparisonOrder(order)
    this.sendComparisonPlots()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_REVISIONS_REORDERED,
      undefined,
      undefined
    )
  }

  private setComparisonRowsOrder(order: string[]) {
    this.paths.setComparisonPathsOrder(order)
    this.sendComparisonPlots()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_COMPARISON_ROWS_REORDERED,
      undefined,
      undefined
    )
  }

  private setTemplateOrder(order: PlotsTemplatesReordered) {
    this.paths.setTemplateOrder(order)
    this.sendTemplatePlots()
    sendTelemetryEvent(
      EventName.VIEWS_REORDER_PLOTS_TEMPLATES,
      undefined,
      undefined
    )
  }

  private setMetricOrder(order: string[]) {
    this.plots.setMetricOrder(order)
    this.sendCheckpointPlotsAndEvent(EventName.VIEWS_REORDER_PLOTS_METRICS)
  }

  private selectPlotsFromWebview() {
    this.selectPlots()
    sendTelemetryEvent(EventName.VIEWS_PLOTS_SELECT_PLOTS, undefined, undefined)
  }

  private selectExperimentsFromWebview() {
    this.experiments.selectExperiments()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SELECT_EXPERIMENTS,
      undefined,
      undefined
    )
  }

  private setExperimentStatus(id: string) {
    this.experiments.toggleExperimentStatus(id)
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_EXPERIMENT_TOGGLE,
      undefined,
      undefined
    )
  }

  private attemptToRefreshRevData(revision: string) {
    Toast.infoWithOptions(`Attempting to refresh plots data for ${revision}.`)
    this.plots.setupManualRefresh(revision)
    this.updateData()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_MANUAL_REFRESH,
      { revisions: 1 },
      undefined
    )
  }

  private attemptToRefreshSelectedData(revisions: string[]) {
    Toast.infoWithOptions('Attempting to refresh visible plots data.')
    for (const revision of revisions) {
      this.plots.setupManualRefresh(revision)
    }
    this.updateData()
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
    this.sendCheckpointPlotsMessage()
    sendTelemetryEvent(event, undefined, undefined)
  }

  private sendSectionCollapsed() {
    this.getWebview()?.show({
      sectionCollapsed: this.plots?.getSectionCollapsed()
    })
  }

  private sendComparisonPlots() {
    this.getWebview()?.show({
      comparison: this.getComparisonPlots(),
      selectedRevisions: this.plots?.getSelectedRevisionDetails()
    })
  }

  private sendTemplatePlots() {
    this.getWebview()?.show({
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
    const paths = this.paths.getComparisonPaths()
    const comparison = this.plots.getComparisonPlots(paths)
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
    const webview = this.getWebview()
    if (webview) {
      return {
        ...plot,
        url: plot.url
          ? `${webview.getWebviewUri(plot.url)}?${getModifiedTime(plot.url)}`
          : undefined
      }
    }
  }

  private getCheckpointPlots() {
    return this.plots?.getCheckpointPlots() || null
  }
}
