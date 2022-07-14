import { PlotSize, Section, SectionCollapsed } from './contract'
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

export class WebviewMessages {
  private readonly paths: PathsModel
  private readonly plots: PlotsModel
  private readonly experiments: Experiments

  private readonly sendSectionCollapsed: () => void
  private readonly sendTemplatePlots: () => void
  private readonly sendComparisonPlots: () => void
  private readonly sendCheckpointPlotsData: () => void
  private readonly selectPlots: () => void
  private readonly updateData: () => void

  constructor(
    paths: PathsModel,
    plots: PlotsModel,
    experiments: Experiments,
    sendSectionCollapsed: () => void,
    sendTemplatePlots: () => void,
    sendComparisonPlots: () => void,
    sendCheckpointPlotsData: () => void,
    selectPlots: () => void,
    updateData: () => void
  ) {
    this.paths = paths
    this.plots = plots
    this.experiments = experiments
    this.sendSectionCollapsed = sendSectionCollapsed
    this.sendTemplatePlots = sendTemplatePlots
    this.sendComparisonPlots = sendComparisonPlots
    this.sendCheckpointPlotsData = sendCheckpointPlotsData
    this.selectPlots = selectPlots
    this.updateData = updateData
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
    this.sendCheckpointPlotsData()
    sendTelemetryEvent(event, undefined, undefined)
  }
}
