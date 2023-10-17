import { join } from 'path'
import { commands } from 'vscode'
import isEmpty from 'lodash.isempty'
import {
  ComparisonPlot,
  ComparisonRevisionData,
  PlotHeight,
  PlotsData as TPlotsData,
  PlotsSection,
  SectionCollapsed,
  Revision
} from './contract'
import { Logger } from '../../common/logger'
import { Experiments } from '../../experiments'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import {
  MessageFromWebview,
  MessageFromWebviewType,
  PlotsTemplatesReordered
} from '../../webview/contract'
import { PlotsModel } from '../model'
import { PathsModel } from '../paths/model'
import { BaseWebview } from '../../webview'
import {
  getModifiedTime,
  openImageFileInEditor,
  showSaveDialog,
  writeFile
} from '../../fileSystem'
import { reorderObjectList } from '../../util/array'
import { CustomPlotsOrderValue } from '../model/custom'
import { getCustomPlotId } from '../model/collect'
import { RegisteredCommands } from '../../commands/external'
import { ErrorsModel } from '../errors/model'
import { openUrl } from '../../vscode/external'

export class WebviewMessages {
  private readonly dvcRoot: string
  private readonly paths: PathsModel
  private readonly plots: PlotsModel
  private readonly errors: ErrorsModel
  private readonly experiments: Experiments

  private readonly getWebview: () => BaseWebview<TPlotsData> | undefined
  private readonly selectPlots: () => Promise<void>

  constructor(
    dvcRoot: string,
    paths: PathsModel,
    plots: PlotsModel,
    errors: ErrorsModel,
    experiments: Experiments,
    getWebview: () => BaseWebview<TPlotsData> | undefined,
    selectPlots: () => Promise<void>
  ) {
    this.dvcRoot = dvcRoot
    this.paths = paths
    this.plots = plots
    this.errors = errors
    this.experiments = experiments
    this.getWebview = getWebview
    this.selectPlots = selectPlots
  }

  public async sendWebviewMessage() {
    const webview = this.getWebview()
    if (!webview) {
      return
    }
    const data = await this.getWebviewData()
    return webview.show(data)
  }

  public handleMessageFromWebview(message: MessageFromWebview) {
    switch (message.type) {
      case MessageFromWebviewType.ADD_PLOT:
        return commands.executeCommand(
          RegisteredCommands.ADD_PLOT,
          this.dvcRoot
        )
      case MessageFromWebviewType.EXPORT_PLOT_DATA_AS_CSV:
        return this.exportPlotDataAsCsv(message.payload)
      case MessageFromWebviewType.EXPORT_PLOT_DATA_AS_TSV:
        return this.exportPlotDataAsTsv(message.payload)
      case MessageFromWebviewType.EXPORT_PLOT_AS_SVG:
        return this.exportPlotAsSvg(message.payload)
      case MessageFromWebviewType.EXPORT_PLOT_DATA_AS_JSON:
        return this.exportPlotDataAsJson(message.payload)
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
      case MessageFromWebviewType.SET_COMPARISON_MULTI_PLOT_VALUE:
        return this.setComparisonMultiPlotValue(
          message.payload.revision,
          message.payload.path,
          message.payload.value
        )
      case MessageFromWebviewType.REMOVE_CUSTOM_PLOTS:
        return commands.executeCommand(
          RegisteredCommands.PLOTS_CUSTOM_REMOVE,
          this.dvcRoot
        )
      case MessageFromWebviewType.REFRESH_REVISIONS:
        return commands.executeCommand(
          RegisteredCommands.PLOTS_REFRESH,
          this.dvcRoot
        )
      case MessageFromWebviewType.TOGGLE_EXPERIMENT:
        return this.setExperimentStatus(message.payload)
      case MessageFromWebviewType.SET_SMOOTH_PLOT_VALUE:
        return this.setSmoothPlotValues(
          message.payload.id,
          message.payload.value
        )
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

  private async getWebviewData(): Promise<TPlotsData> {
    const selectedRevisions = this.plots.getSelectedRevisionDetails()

    const [
      cliError,
      comparison,
      custom,
      hasPlots,
      hasUnselectedPlots,
      sectionCollapsed,
      template
    ] = await Promise.all([
      this.errors.getCliError()?.error || null,
      this.getComparisonPlots(),
      this.getCustomPlots(),
      !!this.paths.hasPaths(),
      this.paths.getHasUnselectedPlots(),
      this.plots.getSectionCollapsed(),
      this.getTemplatePlots(selectedRevisions)
    ])

    return {
      cliError,
      comparison,
      custom,
      hasPlots,
      hasUnselectedPlots,
      sectionCollapsed,
      selectedRevisions,
      template
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

  private setComparisonMultiPlotValue(
    revision: string,
    path: string,
    value: number
  ) {
    this.plots.setComparisonMultiPlotValue(revision, path, value)
    this.sendComparisonPlots()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SET_COMPARISON_MULTI_PLOT_VALUE,
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

  private setSmoothPlotValues(id: string, value: number) {
    this.plots.setSmoothPlotValues(id, value)
    this.sendTemplatePlots()
    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_SET_SMOOTH_PLOT_VALUE,
      undefined,
      undefined
    )
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
    this.sendCustomPlots()
    sendTelemetryEvent(
      EventName.VIEWS_REORDER_PLOTS_CUSTOM,
      undefined,
      undefined
    )
  }

  private selectPlotsFromWebview() {
    void this.selectPlots()
    sendTelemetryEvent(EventName.VIEWS_PLOTS_SELECT_PLOTS, undefined, undefined)
  }

  private selectExperimentsFromWebview() {
    void this.experiments.selectExperimentsToPlot()
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
    const selectedRevisions = this.plots.getSelectedRevisionDetails()
    void this.getWebview()?.show({
      template: this.getTemplatePlots(selectedRevisions)
    })
  }

  private sendCustomPlots() {
    void this.getWebview()?.show({
      custom: this.getCustomPlots()
    })
  }

  private getTemplatePlots(selectedRevisions: Revision[]) {
    const paths = this.paths.getTemplateOrder()
    const plots = this.plots.getTemplatePlots(paths, selectedRevisions)

    if (!plots || isEmpty(plots)) {
      return null
    }

    return {
      height: this.plots.getHeight(PlotsSection.TEMPLATE_PLOTS),
      nbItemsPerRow: this.plots.getNbItemsPerRowOrWidth(
        PlotsSection.TEMPLATE_PLOTS
      ),
      plots,
      smoothPlotValues: this.plots.getSmoothPlotValues()
    }
  }

  private getComparisonPlots() {
    const paths = this.paths.getComparisonPaths()
    const comparison = this.plots.getComparisonPlots(paths)
    if (!comparison || isEmpty(comparison)) {
      return null
    }

    return {
      height: this.plots.getHeight(PlotsSection.COMPARISON_TABLE),
      multiPlotValues: this.plots.getComparisonMultiPlotValues(),
      plots: comparison.map(({ path, revisions }) => {
        return { path, revisions: this.getRevisionsWithCorrectUrls(revisions) }
      }),
      revisions: this.plots.getComparisonRevisions(),
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
      plot.imgs = plot.imgs.map(image => ({
        ...image,
        url: image.url
          ? `${webview.getWebviewUri(image.url)}?${getModifiedTime(image.url)}`
          : undefined
      }))
      return plot
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

  private async exportPlotData(
    extName: string,
    plotId: string,
    event:
      | typeof EventName.VIEWS_PLOTS_EXPORT_PLOT_DATA_AS_CSV
      | typeof EventName.VIEWS_PLOTS_EXPORT_PLOT_DATA_AS_JSON
      | typeof EventName.VIEWS_PLOTS_EXPORT_PLOT_DATA_AS_TSV,
    writeFile: (filePath: string, plotId: string) => void
  ) {
    const file = await showSaveDialog(`data.${extName}`, extName)

    if (!file) {
      return
    }

    sendTelemetryEvent(event, undefined, undefined)

    writeFile(file.path, plotId)
  }

  private async exportPlotAsSvg(svg: string) {
    const file = await showSaveDialog(
      join(this.dvcRoot, 'visualization.svg'),
      'svg'
    )
    if (!file) {
      return
    }

    writeFile(file.path, svg)
    void openUrl(file.path)

    sendTelemetryEvent(
      EventName.VIEWS_PLOTS_EXPORT_PLOT_AS_SVG,
      undefined,
      undefined
    )
  }

  private exportPlotDataAsJson(plotId: string) {
    void this.exportPlotData(
      'json',
      plotId,
      EventName.VIEWS_PLOTS_EXPORT_PLOT_DATA_AS_JSON,
      (filePath: string, plotId: string) =>
        this.plots.savePlotDataAsJson(filePath, plotId)
    )
  }

  private exportPlotDataAsCsv(plotId: string) {
    void this.exportPlotData(
      'csv',
      plotId,
      EventName.VIEWS_PLOTS_EXPORT_PLOT_DATA_AS_CSV,
      (filePath: string, plotId: string) =>
        this.plots.savePlotDataAsCsv(filePath, plotId)
    )
  }

  private exportPlotDataAsTsv(plotId: string) {
    void this.exportPlotData(
      'tsv',
      plotId,
      EventName.VIEWS_PLOTS_EXPORT_PLOT_DATA_AS_TSV,
      (filePath: string, plotId: string) =>
        this.plots.savePlotDataAsTsv(filePath, plotId)
    )
  }
}
