import isEmpty from 'lodash.isempty'
import {
  ComparisonPlot,
  ComparisonRevisionData,
  CustomPlotType,
  PlotsData as TPlotsData,
  Revision,
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
import {
  pickCustomPlots,
  pickCustomPlotType,
  pickMetric,
  pickMetricAndParam
} from '../model/quickPick'
import { Title } from '../../vscode/title'
import { ColumnType } from '../../experiments/webview/contract'
import { FILE_SEPARATOR } from '../../experiments/columns/paths'
import { reorderObjectList } from '../../util/array'
import {
  CHECKPOINTS_PARAM,
  CustomPlotsOrderValue,
  doesCustomPlotAlreadyExist,
  isCheckpointValue
} from '../model/custom'

export class WebviewMessages {
  private readonly paths: PathsModel
  private readonly plots: PlotsModel
  private readonly experiments: Experiments

  private readonly getWebview: () => BaseWebview<TPlotsData> | undefined
  private readonly selectPlots: () => Promise<void>
  private readonly updateData: () => Promise<void>

  constructor(
    paths: PathsModel,
    plots: PlotsModel,
    experiments: Experiments,
    getWebview: () => BaseWebview<TPlotsData> | undefined,
    selectPlots: () => Promise<void>,
    updateData: () => Promise<void>
  ) {
    this.paths = paths
    this.plots = plots
    this.experiments = experiments
    this.getWebview = getWebview
    this.selectPlots = selectPlots
    this.updateData = updateData
  }

  public sendWebviewMessage() {
    const { overrideComparison, overrideRevisions } =
      this.plots.getOverrideRevisionDetails()

    void this.getWebview()?.show({
      comparison: this.getComparisonPlots(overrideComparison),
      custom: this.getCustomPlots(),
      hasPlots: !!this.paths.hasPaths(),
      hasUnselectedPlots: this.paths.getHasUnselectedPlots(),
      sectionCollapsed: this.plots.getSectionCollapsed(),
      selectedRevisions: overrideRevisions,
      template: this.getTemplatePlots(overrideRevisions)
    })
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.ADD_CUSTOM_PLOT:
        return this.addCustomPlot()
      case MessageFromWebviewType.RESIZE_PLOTS:
        return this.setPlotSize(
          message.payload.section,
          message.payload.nbItemsPerRow,
          message.payload.height
        )
      case MessageFromWebviewType.TOGGLE_PLOTS_SECTION:
        return this.setSectionCollapsed(message.payload)
      case MessageFromWebviewType.REORDER_PLOTS_COMPARISON:
        return this.setComparisonOrder(message.payload)
      case MessageFromWebviewType.REORDER_PLOTS_COMPARISON_ROWS:
        return this.setComparisonRowsOrder(message.payload)
      case MessageFromWebviewType.REORDER_PLOTS_TEMPLATES:
        return this.setTemplateOrder(message.payload)
      case MessageFromWebviewType.REORDER_PLOTS_CUSTOM:
        return this.setCustomPlotsOrder(message.payload)
      case MessageFromWebviewType.SELECT_PLOTS:
        return this.selectPlotsFromWebview()
      case MessageFromWebviewType.SELECT_EXPERIMENTS:
        return this.selectExperimentsFromWebview()
      case MessageFromWebviewType.REMOVE_CUSTOM_PLOTS:
        return this.removeCustomPlots()
      case MessageFromWebviewType.REFRESH_REVISION:
        return this.attemptToRefreshRevData(message.payload)
      case MessageFromWebviewType.REFRESH_REVISIONS:
        return this.attemptToRefreshSelectedData(message.payload)
      case MessageFromWebviewType.TOGGLE_EXPERIMENT:
        return this.setExperimentStatus(message.payload)
      case MessageFromWebviewType.ZOOM_PLOT:
        return sendTelemetryEvent(
          EventName.VIEWS_PLOTS_ZOOM_PLOT,
          undefined,
          undefined
        )
      default:
        Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
    }
  }

  private setPlotSize(
    section: Section,
    nbItemsPerRow: number,
    height?: number
  ) {
    this.plots.setNbItemsPerRow(section, nbItemsPerRow)
    this.plots.setHeight(section, height)
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SECTION_RESIZED,
      { height, nbItemsPerRow, section },
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

  private async addMetricVsParamPlot(): Promise<
    CustomPlotsOrderValue | undefined
  > {
    const metricAndParam = await pickMetricAndParam(
      this.experiments.getColumnTerminalNodes()
    )

    if (!metricAndParam) {
      return
    }

    const plotAlreadyExists = doesCustomPlotAlreadyExist(
      this.plots.getCustomPlotsOrder(),
      metricAndParam.metric,
      metricAndParam.param
    )

    if (plotAlreadyExists) {
      return Toast.showError('Custom plot already exists.')
    }

    const plot = {
      ...metricAndParam,
      type: CustomPlotType.METRIC_VS_PARAM
    }
    this.plots.addCustomPlot(plot)
    this.sendCustomPlotsAndEvent(EventName.VIEWS_PLOTS_CUSTOM_PLOT_ADDED)
  }

  private async addCheckpointPlot(): Promise<
    CustomPlotsOrderValue | undefined
  > {
    const metric = await pickMetric(this.experiments.getColumnTerminalNodes())

    if (!metric) {
      return
    }

    const plotAlreadyExists = doesCustomPlotAlreadyExist(
      this.plots.getCustomPlotsOrder(),
      metric
    )

    if (plotAlreadyExists) {
      return Toast.showError('Custom plot already exists.')
    }

    const plot: CustomPlotsOrderValue = {
      metric,
      param: CHECKPOINTS_PARAM,
      type: CustomPlotType.CHECKPOINT
    }
    this.plots.addCustomPlot(plot)
    this.sendCustomPlotsAndEvent(EventName.VIEWS_PLOTS_CUSTOM_PLOT_ADDED)
  }

  private async addCustomPlot() {
    if (!this.experiments.hasCheckpoints()) {
      return this.addMetricVsParamPlot()
    }

    const plotType = await pickCustomPlotType()

    if (!plotType) {
      return
    }

    return isCheckpointValue(plotType)
      ? this.addCheckpointPlot()
      : this.addMetricVsParamPlot()
  }

  private async removeCustomPlots() {
    const selectedPlotsIds = await pickCustomPlots(
      this.plots.getCustomPlotsOrder(),
      'There are no plots to remove.',
      {
        title: Title.SELECT_CUSTOM_PLOTS_TO_REMOVE
      }
    )

    if (!selectedPlotsIds) {
      return
    }

    this.plots.removeCustomPlots(selectedPlotsIds)
    this.sendCustomPlotsAndEvent(EventName.VIEWS_PLOTS_CUSTOM_PLOT_REMOVED)
  }

  private setCustomPlotsOrder(plotIds: string[]) {
    const customPlots = this.plots.getCustomPlots()?.plots
    if (!customPlots) {
      return
    }

    const buildMetricOrParamPath = (type: string, path: string) =>
      type + FILE_SEPARATOR + path

    const newOrder: CustomPlotsOrderValue[] = reorderObjectList(
      plotIds,
      customPlots,
      'id'
    ).map(plot => ({
      metric: buildMetricOrParamPath(ColumnType.METRICS, plot.metric),
      param: isCheckpointValue(plot.type)
        ? plot.param
        : buildMetricOrParamPath(ColumnType.PARAMS, plot.param),
      type: plot.type
    }))
    this.plots.setCustomPlotsOrder(newOrder)
    this.sendCustomPlotsAndEvent(EventName.VIEWS_REORDER_PLOTS_CUSTOM)
  }

  private sendCustomPlotsAndEvent(
    event:
      | typeof EventName.VIEWS_PLOTS_CUSTOM_PLOT_ADDED
      | typeof EventName.VIEWS_PLOTS_CUSTOM_PLOT_REMOVED
      | typeof EventName.VIEWS_REORDER_PLOTS_CUSTOM
  ) {
    this.sendCustomPlots()
    sendTelemetryEvent(event, undefined, undefined)
  }

  private selectPlotsFromWebview() {
    void this.selectPlots()
    sendTelemetryEvent(EventName.VIEWS_PLOTS_SELECT_PLOTS, undefined, undefined)
  }

  private selectExperimentsFromWebview() {
    void this.experiments.selectExperiments()
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
    void Toast.infoWithOptions(
      `Attempting to refresh plots data for ${revision}.`
    )
    this.plots.setupManualRefresh(revision)
    void this.updateData()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_MANUAL_REFRESH,
      { revisions: 1 },
      undefined
    )
  }

  private attemptToRefreshSelectedData(revisions: string[]) {
    void Toast.infoWithOptions('Attempting to refresh visible plots data.')
    for (const revision of revisions) {
      this.plots.setupManualRefresh(revision)
    }
    void this.updateData()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_MANUAL_REFRESH,
      { revisions: revisions.length },
      undefined
    )
  }

  private sendSectionCollapsed() {
    void this.getWebview()?.show({
      sectionCollapsed: this.plots.getSectionCollapsed()
    })
  }

  private sendComparisonPlots() {
    void this.getWebview()?.show({
      comparison: this.getComparisonPlots()
    })
  }

  private sendTemplatePlots() {
    void this.getWebview()?.show({
      template: this.getTemplatePlots()
    })
  }

  private sendCustomPlots() {
    void this.getWebview()?.show({
      custom: this.getCustomPlots()
    })
  }

  private getTemplatePlots(overrideRevs?: Revision[]) {
    const paths = this.paths.getTemplateOrder()
    const plots = this.plots.getTemplatePlots(paths, overrideRevs)

    if (!plots || isEmpty(plots)) {
      return null
    }

    return {
      height: this.plots.getHeight(Section.TEMPLATE_PLOTS),
      nbItemsPerRow: this.plots.getNbItemsPerRow(Section.TEMPLATE_PLOTS),
      plots
    }
  }

  private getComparisonPlots(overrideRevs?: Revision[]) {
    const paths = this.paths.getComparisonPaths()
    const comparison = this.plots.getComparisonPlots(
      paths,
      overrideRevs?.map(({ revision }) => revision)
    )
    if (!comparison || isEmpty(comparison)) {
      return null
    }

    return {
      height: this.plots.getHeight(Section.COMPARISON_TABLE),
      nbItemsPerRow: this.plots.getNbItemsPerRow(Section.COMPARISON_TABLE),
      plots: comparison.map(({ path, revisions }) => {
        return { path, revisions: this.getRevisionsWithCorrectUrls(revisions) }
      }),
      revisions: overrideRevs || this.plots.getComparisonRevisions()
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

  private getCustomPlots() {
    return this.plots.getCustomPlots() || null
  }
}
