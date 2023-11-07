import { Memento } from 'vscode'
import {
  collectData,
  collectSelectedTemplatePlots,
  collectTemplates,
  ComparisonData,
  RevisionData,
  TemplateAccumulator,
  collectCustomPlots,
  getCustomPlotId,
  collectOrderedRevisions,
  collectImageUrl,
  collectIdShas,
  collectSelectedTemplatePlotRawData,
  collectCustomPlotRawData,
  collectSelectedComparisonPlots
} from './collect'
import { getRevisionSummaryColumns } from './util'
import { cleanupOldOrderValue, CustomPlotsOrderValue } from './custom'
import {
  Revision,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH,
  PlotsSection,
  SectionCollapsed,
  CustomPlotsData,
  DEFAULT_HEIGHT,
  DEFAULT_NB_ITEMS_PER_ROW,
  PlotHeight,
  SmoothPlotValues,
  ImagePlot,
  ComparisonMultiPlotValues,
  ComparisonPlotImg
} from '../webview/contract'
import {
  EXPERIMENT_WORKSPACE_ID,
  PlotsOutput,
  PlotsOutputOrError
} from '../../cli/dvc/contract'
import { Experiments } from '../../experiments'
import { getColorScale } from '../vega/util'
import {
  definedAndNonEmpty,
  reorderObjectList,
  sameContents
} from '../../util/array'
import { TemplateOrder } from '../paths/collect'
import { PersistenceKey } from '../../persistence/constants'
import { ModelWithPersistence } from '../../persistence/model'
import {
  collectMultiSourceEncoding,
  collectMultiSourceVariations,
  MultiSourceEncoding,
  MultiSourceVariations
} from '../multiSource/collect'
import { isDvcError } from '../../cli/dvc/reader'
import { ErrorsModel } from '../errors/model'
import {
  openFileInEditor,
  writeCsv,
  writeJson,
  writeTsv
} from '../../fileSystem'
import { Toast } from '../../vscode/toast'

export class PlotsModel extends ModelWithPersistence {
  private readonly experiments: Experiments
  private readonly errors: ErrorsModel

  private nbItemsPerRowOrWidth: Record<PlotsSection, number>
  private height: Record<PlotsSection, PlotHeight>
  private customPlotsOrder: CustomPlotsOrderValue[]
  private sectionCollapsed: SectionCollapsed

  private fetchedRevs = new Set<string>()
  private idShas: { [id: string]: string } = {}

  private comparisonData: ComparisonData = {}
  private comparisonOrder: string[]
  private comparisonMultiPlotValues: ComparisonMultiPlotValues = {}
  private smoothPlotValues: SmoothPlotValues = {}

  private revisionData: RevisionData = {}
  private templates: TemplateAccumulator = {}
  private multiSourceVariations: MultiSourceVariations = {}
  private multiSourceEncoding: MultiSourceEncoding = {}

  constructor(
    dvcRoot: string,
    experiments: Experiments,
    errors: ErrorsModel,
    workspaceState: Memento
  ) {
    super(dvcRoot, workspaceState)
    this.experiments = experiments
    this.errors = errors

    this.nbItemsPerRowOrWidth = this.revive(
      PersistenceKey.PLOT_NB_ITEMS_PER_ROW_OR_WIDTH,
      DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH
    )
    this.height = this.revive(PersistenceKey.PLOT_HEIGHT, DEFAULT_HEIGHT)

    this.sectionCollapsed = this.revive(
      PersistenceKey.PLOT_SECTION_COLLAPSED,
      DEFAULT_SECTION_COLLAPSED
    )
    this.comparisonOrder = this.revive(PersistenceKey.PLOT_COMPARISON_ORDER, [])
    this.customPlotsOrder = this.revive(PersistenceKey.PLOTS_CUSTOM_ORDER, [])
    this.smoothPlotValues = this.revive(
      PersistenceKey.PLOTS_SMOOTH_PLOT_VALUES,
      {}
    )
    this.comparisonMultiPlotValues = this.revive(
      PersistenceKey.PLOTS_COMPARISON_MULTI_PLOT_VALUES,
      {}
    )

    this.cleanupOutdatedCustomPlotsState()
    this.cleanupOutdatedTrendsState()
  }

  public async transformAndSet(output: PlotsOutputOrError, revs: string[]) {
    if (isDvcError(output)) {
      this.handleCliError()
    } else {
      await this.processOutput(output, revs)
    }
    this.setComparisonOrder()

    this.fetchedRevs = new Set(revs)

    this.deferred.resolve()
  }

  public removeStaleData() {
    const idShas = collectIdShas(
      this.experiments.getWorkspaceCommitsAndExperiments()
    )

    for (const id of Object.keys(this.idShas)) {
      if (this.idShas[id] !== idShas[id]) {
        this.deleteRevisionData(id)
        this.fetchedRevs.delete(id)
      }
    }

    this.idShas = idShas
  }

  public getCustomPlots(): CustomPlotsData | undefined {
    const experiments = this.experiments.getUnfilteredCommitsAndExperiments()
    const hasUnfilteredExperiments = experiments.length > 0
    const plotsOrderValues = this.getCustomPlotsOrder()
    const height = this.getHeight(PlotsSection.CUSTOM_PLOTS)
    const nbItemsPerRow = this.getNbItemsPerRowOrWidth(
      PlotsSection.CUSTOM_PLOTS
    )
    const hasAddedPlots = plotsOrderValues.length > 0

    const colorScale = getColorScale(
      this.getSelectedRevisionDetails().filter(
        ({ id }) => id !== EXPERIMENT_WORKSPACE_ID
      )
    )

    return {
      hasAddedPlots,
      hasUnfilteredExperiments,
      height,
      nbItemsPerRow,
      plots: hasUnfilteredExperiments
        ? collectCustomPlots({
            colorScale,
            experiments,
            height,
            nbItemsPerRow,
            plotsOrderValues
          })
        : []
    }
  }

  public getCustomPlotsOrder() {
    return this.customPlotsOrder
  }

  public updateCustomPlotsOrder(plotsOrder: CustomPlotsOrderValue[]) {
    this.customPlotsOrder = plotsOrder
  }

  public setCustomPlotsOrder(plotsOrder: CustomPlotsOrderValue[]) {
    this.updateCustomPlotsOrder(plotsOrder)
    this.persist(PersistenceKey.PLOTS_CUSTOM_ORDER, this.customPlotsOrder)
  }

  public removeCustomPlots(plotIds: string[]) {
    const newCustomPlotsOrder = this.getCustomPlotsOrder().filter(
      ({ metric, param }) => !plotIds.includes(getCustomPlotId(metric, param))
    )

    this.setCustomPlotsOrder(newCustomPlotsOrder)
  }

  public addCustomPlot(value: CustomPlotsOrderValue) {
    const newCustomPlotsOrder = [...this.getCustomPlotsOrder(), value]
    this.setCustomPlotsOrder(newCustomPlotsOrder)
  }

  public getRevisionColors() {
    return getColorScale(this.getSelectedRevisionDetails())
  }

  public getSelectedRevisionDetails() {
    const selectedRevisions: Revision[] = []
    const summaryColumns = this.experiments.getSummaryColumnOrder()
    for (const experiment of this.experiments.getSelectedRevisions()) {
      const { commit, description, label, displayColor, id } = experiment
      const revision: Revision = {
        description: commit ? undefined : description,
        displayColor,
        errors: this.errors.getRevisionErrors(id),
        fetched: this.fetchedRevs.has(id),
        id,
        label,
        summaryColumns: getRevisionSummaryColumns(summaryColumns, experiment)
      }

      if (commit) {
        revision.commit = description
      }
      selectedRevisions.push(revision)
    }

    return selectedRevisions
  }

  public savePlotDataAsJson(filePath: string, plotId: string) {
    this.savePlotData(filePath, plotId, data => writeJson(filePath, data, true))
  }

  public savePlotDataAsCsv(filePath: string, plotId: string) {
    void this.savePlotData(filePath, plotId, data => writeCsv(filePath, data))
  }

  public savePlotDataAsTsv(filePath: string, plotId: string) {
    void this.savePlotData(filePath, plotId, data => writeTsv(filePath, data))
  }

  public getTemplatePlots(
    order: TemplateOrder | undefined,
    selectedRevisions: Revision[]
  ) {
    if (!definedAndNonEmpty(order)) {
      return
    }

    if (!definedAndNonEmpty(selectedRevisions)) {
      return
    }

    return this.getSelectedTemplatePlots(order, selectedRevisions)
  }

  public getComparisonPlots(paths: string[] | undefined) {
    if (!paths) {
      return
    }

    const selectedRevisionIds = this.getSelectedRevisionIds()
    if (!definedAndNonEmpty(selectedRevisionIds)) {
      return
    }

    return this.getSelectedComparisonPlots(paths, selectedRevisionIds)
  }

  public requiresUpdate() {
    return !sameContents([...this.fetchedRevs], this.getSelectedRevisionIds())
  }

  public getComparisonRevisions() {
    return reorderObjectList<Revision>(
      this.comparisonOrder,
      this.getSelectedRevisionDetails(),
      'id'
    )
  }

  public setComparisonOrder(revisions: string[] = this.comparisonOrder) {
    const currentRevisions = this.getSelectedRevisionIds()

    this.comparisonOrder = revisions.filter(revision =>
      currentRevisions.includes(revision)
    )

    for (const revision of currentRevisions) {
      if (!this.comparisonOrder.includes(revision)) {
        this.comparisonOrder.push(revision)
      }
    }

    this.persist(PersistenceKey.PLOT_COMPARISON_ORDER, this.comparisonOrder)
  }

  public setComparisonMultiPlotValue(
    revision: string,
    path: string,
    value: number
  ) {
    if (!this.comparisonMultiPlotValues[revision]) {
      this.comparisonMultiPlotValues[revision] = {}
    }

    this.comparisonMultiPlotValues[revision][path] = value
    this.persist(
      PersistenceKey.PLOTS_COMPARISON_MULTI_PLOT_VALUES,
      this.comparisonMultiPlotValues
    )
  }

  public getComparisonMultiPlotValues() {
    return this.comparisonMultiPlotValues
  }

  public getSelectedRevisionIds() {
    return this.experiments.getSelectedRevisions().map(({ id }) => id)
  }

  public getSelectedOrderedIds() {
    return collectOrderedRevisions(this.experiments.getSelectedRevisions()).map(
      ({ id }) => id
    )
  }

  public setNbItemsPerRowOrWidth(section: PlotsSection, nbItemsPerRow: number) {
    this.nbItemsPerRowOrWidth[section] = nbItemsPerRow
    this.persist(
      PersistenceKey.PLOT_NB_ITEMS_PER_ROW_OR_WIDTH,
      this.nbItemsPerRowOrWidth
    )
  }

  public setSmoothPlotValues(id: string, value: number) {
    this.smoothPlotValues[id] = value
    this.persist(PersistenceKey.PLOTS_SMOOTH_PLOT_VALUES, this.smoothPlotValues)
  }

  public getSmoothPlotValues() {
    return this.smoothPlotValues
  }

  public getNbItemsPerRowOrWidth(section: PlotsSection) {
    if (this.nbItemsPerRowOrWidth[section]) {
      return this.nbItemsPerRowOrWidth[section]
    }
    return DEFAULT_NB_ITEMS_PER_ROW
  }

  public setHeight(section: PlotsSection, height: PlotHeight) {
    this.height[section] = height
    this.persist(PersistenceKey.PLOT_HEIGHT, this.height)
  }

  public resetFetched() {
    this.fetchedRevs = new Set()
  }

  public getHeight(section: PlotsSection) {
    return this.height[section]
  }

  public setSectionCollapsed(newState: Partial<SectionCollapsed>) {
    this.sectionCollapsed = {
      ...this.sectionCollapsed,
      ...newState
    }
    this.persist(PersistenceKey.PLOT_SECTION_COLLAPSED, this.sectionCollapsed)
  }

  public getSectionCollapsed() {
    return this.sectionCollapsed
  }

  public getMultiSourceData() {
    return this.multiSourceEncoding
  }

  private handleCliError() {
    this.comparisonData = {}
    this.revisionData = {}
    this.templates = {}
    this.multiSourceVariations = {}
    this.multiSourceEncoding = {}
  }

  private async processOutput(output: PlotsOutput, revs: string[]) {
    for (const rev of revs) {
      this.deleteRevisionData(rev)
    }

    const [{ comparisonData, revisionData }, templates, multiSourceVariations] =
      await Promise.all([
        collectData(output),
        collectTemplates(output),
        collectMultiSourceVariations(output)
      ])

    this.comparisonData = {
      ...this.comparisonData,
      ...comparisonData
    }

    this.revisionData = {
      ...this.revisionData,
      ...revisionData
    }
    this.templates = templates
    this.multiSourceVariations = multiSourceVariations
    this.multiSourceEncoding = collectMultiSourceEncoding(
      this.multiSourceVariations
    )
  }

  private cleanupOutdatedCustomPlotsState() {
    const order = this.getCustomPlotsOrder()
    const newOrder = order
      .filter(plot => (plot as { type?: 'checkpoint' }).type !== 'checkpoint')
      .map(value => cleanupOldOrderValue(value))
    this.setCustomPlotsOrder(newOrder)
  }

  private cleanupOutdatedTrendsState() {
    this.persist(PersistenceKey.PLOT_METRIC_ORDER, undefined)
    this.persist(PersistenceKey.PLOT_SELECTED_METRICS, undefined)
  }

  private deleteRevisionData(id: string) {
    delete this.revisionData[id]
    delete this.comparisonData[id]
  }

  private getSelectedComparisonPlots(
    paths: string[],
    selectedRevisionIds: string[]
  ) {
    return collectSelectedComparisonPlots({
      comparisonData: this.comparisonData,
      getComparisonPlotImg: (image: ImagePlot, id: string, path: string) => {
        const errors = this.errors.getImageErrors(path, id)
        const fetched = this.fetchedRevs.has(id)
        const url = collectImageUrl(image, fetched)
        const loading = !fetched && !url

        const plot: ComparisonPlotImg = {
          errors,
          loading,
          url
        }

        if (typeof image.ind === 'number') {
          plot.ind = image.ind
        }

        return plot
      },
      paths,
      selectedRevisionIds
    })
  }

  private getSelectedTemplatePlots(
    order: TemplateOrder,
    selectedRevisions: Revision[]
  ) {
    return collectSelectedTemplatePlots(
      order,
      selectedRevisions.map(({ id }) => id),
      this.templates,
      this.revisionData,
      this.getNbItemsPerRowOrWidth(PlotsSection.TEMPLATE_PLOTS),
      this.getHeight(PlotsSection.TEMPLATE_PLOTS),
      this.getRevisionColors(),
      this.multiSourceEncoding
    )
  }

  private getSelectedTemplatePlotData(path: string) {
    const selectedRevisions = this.getSelectedRevisionDetails()

    return collectSelectedTemplatePlotRawData({
      multiSourceEncodingUpdate: this.multiSourceEncoding[path] || {},
      path,
      revisionData: this.revisionData,
      selectedRevisions: selectedRevisions.map(({ id }) => id),
      template: this.templates[path]
    })
  }

  private getCustomPlotData(orderValue: CustomPlotsOrderValue) {
    const experiments = this.experiments
      .getWorkspaceCommitsAndExperiments()
      .filter(({ id }) => id !== EXPERIMENT_WORKSPACE_ID)

    return collectCustomPlotRawData(orderValue, experiments)
  }

  private savePlotData(
    filePath: string,
    plotId: string,
    writeToFile: (rawData: Array<Record<string, unknown>>) => void
  ) {
    const foundCustomPlot = this.customPlotsOrder.find(
      ({ metric, param }) => getCustomPlotId(metric, param) === plotId
    )

    const rawData = foundCustomPlot
      ? this.getCustomPlotData(foundCustomPlot)
      : this.getSelectedTemplatePlotData(plotId)

    try {
      writeToFile(rawData)
      void openFileInEditor(filePath)
    } catch {
      void Toast.showError('Cannot write to file')
    }
  }
}
