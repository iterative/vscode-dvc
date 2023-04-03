import isEmpty from 'lodash.isempty'
import {
  ComparisonPlot,
  ComparisonRevisionData,
  PlotHeight,
  PlotsData as TPlotsData,
  Revision,
  PlotsSection,
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
import { pickCustomPlots, pickMetricAndParam } from '../model/quickPick'
import { getModifiedTime, openImageFileInEditor } from '../../fileSystem'
import { Title } from '../../vscode/title'
import { reorderObjectList } from '../../util/array'
import { CustomPlotsOrderValue } from '../model/custom'
import { getCustomPlotId } from '../model/collect'

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

    const comparison = this.getComparisonPlots(overrideComparison)

    void this.getWebview()?.show({
      comparison,
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
      case MessageFromWebviewType.REFRESH_REVISIONS:
        return this.refreshData()
      case MessageFromWebviewType.TOGGLE_EXPERIMENT:
        return this.setExperimentStatus(message.payload)
      case MessageFromWebviewType.ZOOM_PLOT:
        if (message.payload) {
          const imagePath = this.revertCorrectUrl(message.payload)
          void openImageFileInEditor(imagePath)
        }
        return sendTelemetryEvent(
          EventName.VIEWS_PLOTS_ZOOM_PLOT,
          { isImage: !!message.payload },
          undefined
        )
      default:
        Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
    }
  }

  private setPlotSize(
    section: PlotsSection,
    nbItemsPerRow: number,
    height: PlotHeight
  ) {
    this.plots.setNbItemsPerRowOrWidth(section, nbItemsPerRow)
    this.plots.setHeight(section, height)
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SECTION_RESIZED,
      { height, nbItemsPerRow, section },
      undefined
    )

    switch (section) {
      case PlotsSection.COMPARISON_TABLE:
        this.sendComparisonPlots()
        break
      case PlotsSection.CUSTOM_PLOTS:
        this.sendCustomPlots()
        break
      case PlotsSection.TEMPLATE_PLOTS:
        this.sendTemplatePlots()
        break
      default:
    }
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

  private async addCustomPlot() {
    const metricAndParam = await pickMetricAndParam(
      this.experiments.getColumnTerminalNodes(),
      this.plots.getCustomPlotsOrder()
    )

    if (!metricAndParam) {
      return
    }

    this.plots.addCustomPlot(metricAndParam)
    this.sendCustomPlotsAndEvent(EventName.VIEWS_PLOTS_CUSTOM_PLOT_ADDED)
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
    const customPlotsOrderWithId = this.plots
      .getCustomPlotsOrder()
      .map(value => ({
        ...value,
        id: getCustomPlotId(value.metric, value.param)
      }))

    const newOrder: CustomPlotsOrderValue[] = reorderObjectList(
      plotIds,
      customPlotsOrderWithId,
      'id'
    ).map(({ metric, param }) => ({
      metric,
      param
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

  private refreshData() {
    void Toast.infoWithOptions('Attempting to refresh visible plots data.')
    void this.updateData()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_MANUAL_REFRESH,
      undefined,
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
      height: this.plots.getHeight(PlotsSection.TEMPLATE_PLOTS),
      nbItemsPerRow: this.plots.getNbItemsPerRowOrWidth(
        PlotsSection.TEMPLATE_PLOTS
      ),
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
      height: this.plots.getHeight(PlotsSection.COMPARISON_TABLE),
      plots: comparison.map(({ path, revisions }) => {
        return { path, revisions: this.getRevisionsWithCorrectUrls(revisions) }
      }),
      revisions: overrideRevs || this.plots.getComparisonRevisions(),
      width: this.plots.getNbItemsPerRowOrWidth(PlotsSection.COMPARISON_TABLE)
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

  private revertCorrectUrl(url: string) {
    const webview = this.getWebview()
    if (webview) {
      const toRemove = webview.getWebviewUri('')
      return url.replace(toRemove, '').split('?')[0]
    }
    return url
  }

  private getCustomPlots() {
    return this.plots.getCustomPlots() || null
  }
}
