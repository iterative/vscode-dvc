import { Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import isEqual from 'lodash.isequal'
import {
  collectCheckpointPlotsData,
  collectData,
  collectMetricOrder,
  collectSelectedTemplatePlots,
  collectTemplates,
  ComparisonData,
  RevisionData,
  TemplateAccumulator,
  collectCommitRevisionDetails,
  collectOverrideRevisionDetails,
  collectCustomPlotsData,
  getCustomPlotId
} from './collect'
import { getRevisionFirstThreeColumns } from './util'
import {
  CheckpointPlot,
  CheckpointPlotData,
  ComparisonPlots,
  Revision,
  ComparisonRevisionData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW,
  Section,
  SectionCollapsed,
  CustomPlotData,
  PlotNumberOfItemsPerRow
} from '../webview/contract'
import {
  ExperimentsOutput,
  EXPERIMENT_WORKSPACE_ID,
  PlotsOutputOrError
} from '../../cli/dvc/contract'
import { Experiments } from '../../experiments'
import { getColorScale, truncateVerticalTitle } from '../vega/util'
import { definedAndNonEmpty, reorderObjectList } from '../../util/array'
import { removeMissingKeysFromObject } from '../../util/object'
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

export type CustomPlotsOrderValue = { metric: string; param: string }

export class PlotsModel extends ModelWithPersistence {
  private readonly experiments: Experiments

  private plotSizes: Record<Section, number>
  private customPlotsOrder: CustomPlotsOrderValue[]
  private sectionCollapsed: SectionCollapsed
  private commitRevisions: Record<string, string> = {}

  private fetchedRevs = new Set<string>()

  private comparisonData: ComparisonData = {}
  private comparisonOrder: string[]

  private revisionData: RevisionData = {}
  private templates: TemplateAccumulator = {}
  private multiSourceVariations: MultiSourceVariations = {}
  private multiSourceEncoding: MultiSourceEncoding = {}

  private checkpointPlots?: CheckpointPlot[]
  private customPlots?: CustomPlotData[]
  private selectedMetrics?: string[]
  private metricOrder: string[]

  constructor(
    dvcRoot: string,
    experiments: Experiments,
    workspaceState: Memento
  ) {
    super(dvcRoot, workspaceState)
    this.experiments = experiments

    this.plotSizes = this.revive(
      PersistenceKey.PLOT_SIZES,
      DEFAULT_SECTION_NB_ITEMS_PER_ROW
    )
    this.sectionCollapsed = this.revive(
      PersistenceKey.PLOT_SECTION_COLLAPSED,
      DEFAULT_SECTION_COLLAPSED
    )
    this.comparisonOrder = this.revive(PersistenceKey.PLOT_COMPARISON_ORDER, [])
    this.selectedMetrics = this.revive(
      PersistenceKey.PLOT_SELECTED_METRICS,
      undefined
    )
    this.metricOrder = this.revive(PersistenceKey.PLOT_METRIC_ORDER, [])

    this.customPlotsOrder = this.revive(PersistenceKey.PLOTS_CUSTOM_ORDER, [])
  }

  public transformAndSetExperiments(data: ExperimentsOutput) {
    const checkpointPlots = collectCheckpointPlotsData(data)

    if (!this.selectedMetrics && checkpointPlots) {
      this.selectedMetrics = checkpointPlots.map(({ id }) => id)
    }

    this.checkpointPlots = checkpointPlots

    this.setMetricOrder()

    this.recreateCustomPlots()

    return this.removeStaleData()
  }

  public async transformAndSetPlots(data: PlotsOutputOrError, revs: string[]) {
    if (isDvcError(data)) {
      return
    }

    const cliIdToLabel = this.getCLIIdToLabel()

    const [{ comparisonData, revisionData }, templates, multiSourceVariations] =
      await Promise.all([
        collectData(data, cliIdToLabel),
        collectTemplates(data),
        collectMultiSourceVariations(data, this.multiSourceVariations)
      ])

    this.recreateCustomPlots()

    this.comparisonData = {
      ...this.comparisonData,
      ...comparisonData
    }
    this.revisionData = {
      ...this.revisionData,
      ...revisionData
    }
    this.templates = { ...this.templates, ...templates }
    this.multiSourceVariations = multiSourceVariations
    this.multiSourceEncoding = collectMultiSourceEncoding(
      this.multiSourceVariations
    )

    this.setComparisonOrder()

    this.fetchedRevs = new Set([
      ...this.fetchedRevs,
      ...revs.map(rev => cliIdToLabel[rev])
    ])

    this.experiments.setRevisionCollected(revs)

    this.deferred.resolve()
  }

  public getCheckpointPlots() {
    if (!this.checkpointPlots) {
      return
    }

    const colors = getColorScale(
      this.experiments
        .getSelectedExperiments()
        .map(({ displayColor, id: revision }) => ({ displayColor, revision }))
    )

    if (!colors) {
      return
    }

    const { domain: selectedExperiments } = colors

    return {
      colors,
      nbItemsPerRow: this.getPlotSize(Section.CHECKPOINT_PLOTS),
      plots: this.getPlots(this.checkpointPlots, selectedExperiments),
      selectedMetrics: this.getSelectedMetrics()
    }
  }

  public getCustomPlots() {
    if (!this.customPlots) {
      return
    }
    return {
      nbItemsPerRow: this.getPlotSize(Section.CUSTOM_PLOTS),
      plots: this.customPlots
    }
  }

  public recreateCustomPlots() {
    const customPlots: CustomPlotData[] = collectCustomPlotsData(
      this.getCustomPlotsOrder(),
      this.experiments.getExperiments()
    )
    this.customPlots = customPlots
  }

  public getCustomPlotsOrder() {
    return this.customPlotsOrder
  }

  public setCustomPlotsOrder(plotsOrder: CustomPlotsOrderValue[]) {
    this.customPlotsOrder = plotsOrder
    this.persist(PersistenceKey.PLOTS_CUSTOM_ORDER, this.customPlotsOrder)
    this.recreateCustomPlots()
  }

  public removeCustomPlots(plotIds: string[]) {
    const newCustomPlotsOrder = this.getCustomPlotsOrder().filter(
      ({ metric, param }) => {
        return !plotIds.includes(getCustomPlotId(metric, param))
      }
    )

    this.setCustomPlotsOrder(newCustomPlotsOrder)
  }

  public addCustomPlot(metricAndParam: CustomPlotsOrderValue) {
    const newCustomPlotsOrder = [...this.getCustomPlotsOrder(), metricAndParam]
    this.setCustomPlotsOrder(newCustomPlotsOrder)
  }

  public setupManualRefresh(id: string) {
    this.deleteRevisionData(id)
  }

  public getOverrideRevisionDetails() {
    const finishedExperiments = this.experiments.getFinishedExperiments()

    if (
      (this.experiments.hasCheckpoints() &&
        this.experiments.hasRunningExperiment()) ||
      !isEmpty(finishedExperiments)
    ) {
      return collectOverrideRevisionDetails(
        this.comparisonOrder,
        this.experiments.getSelectedRevisions(),
        this.fetchedRevs,
        finishedExperiments,
        id => this.experiments.getCheckpoints(id),
        this.experiments.getFirstThreeColumnOrder()
      )
    }

    return {
      overrideComparison: this.getComparisonRevisions(),
      overrideRevisions: this.getSelectedRevisionDetails()
    }
  }

  public getUnfetchedRevisions() {
    return this.getSelectedRevisions().filter(
      revision => !this.fetchedRevs.has(revision)
    )
  }

  public getMissingRevisions() {
    const cachedRevisions = new Set([
      ...Object.keys(this.comparisonData),
      ...Object.keys(this.revisionData)
    ])

    return this.getSelectedRevisions()
      .filter(label => !cachedRevisions.has(label))
      .map(label => this.getCLIId(label))
  }

  public getMutableRevisions() {
    return this.experiments.getMutableRevisions()
  }

  public getRevisionColors(overrideRevs?: Revision[]) {
    return getColorScale(overrideRevs || this.getSelectedRevisionDetails())
  }

  public getSelectedRevisionDetails() {
    return this.experiments.getSelectedRevisions().map(exp => {
      const {
        commit,
        displayNameOrParent,
        label,
        displayColor,
        logicalGroupName,
        id
      } = exp
      const revision: Revision = {
        displayColor,
        fetched: this.fetchedRevs.has(label),
        firstThreeColumns: getRevisionFirstThreeColumns(
          this.experiments.getFirstThreeColumnOrder(),
          exp
        ),
        group: logicalGroupName,
        id,
        revision: label
      }

      if (commit) {
        revision.commit = displayNameOrParent
      }
      return revision
    })
  }

  public getTemplatePlots(
    order: TemplateOrder | undefined,
    overrideRevs?: Revision[]
  ) {
    if (!definedAndNonEmpty(order)) {
      return
    }

    const selectedRevisions = overrideRevs || this.getSelectedRevisionDetails()

    if (!definedAndNonEmpty(selectedRevisions)) {
      return
    }

    return this.getSelectedTemplatePlots(order, selectedRevisions)
  }

  public getComparisonPlots(
    paths: string[] | undefined,
    overrideRevs?: string[]
  ) {
    if (!paths) {
      return
    }

    const selectedRevisions = overrideRevs || this.getSelectedRevisions()
    if (!definedAndNonEmpty(selectedRevisions)) {
      return
    }

    return this.getSelectedComparisonPlots(paths, selectedRevisions)
  }

  public getComparisonRevisions() {
    return reorderObjectList<Revision>(
      this.comparisonOrder,
      this.getSelectedRevisionDetails(),
      'revision'
    )
  }

  public setComparisonOrder(revisions: string[] = this.comparisonOrder) {
    const currentRevisions = this.getSelectedRevisions()

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

  public getSelectedRevisions() {
    return this.experiments.getSelectedRevisions().map(({ label }) => label)
  }

  public setSelectedMetrics(selectedMetrics: string[]) {
    this.selectedMetrics = selectedMetrics
    this.setMetricOrder()
    this.persist(
      PersistenceKey.PLOT_SELECTED_METRICS,
      this.getSelectedMetrics()
    )
  }

  public getSelectedMetrics() {
    return this.selectedMetrics
  }

  public setMetricOrder(metricOrder?: string[]) {
    this.metricOrder = collectMetricOrder(
      this.checkpointPlots,
      metricOrder || this.metricOrder,
      this.selectedMetrics
    )
    this.persist(PersistenceKey.PLOT_METRIC_ORDER, this.metricOrder)
  }

  public setPlotSize(section: Section, nbItemsPerRow: number) {
    this.plotSizes[section] = nbItemsPerRow
    this.persist(PersistenceKey.PLOT_SIZES, this.plotSizes)
  }

  public getPlotSize(section: Section) {
    if (
      this.plotSizes[section] &&
      [
        PlotNumberOfItemsPerRow.LARGE,
        PlotNumberOfItemsPerRow.REGULAR,
        PlotNumberOfItemsPerRow.SMALL,
        PlotNumberOfItemsPerRow.SMALLER
      ].includes(this.plotSizes[section])
    ) {
      return this.plotSizes[section]
    }
    return PlotNumberOfItemsPerRow.REGULAR
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

  public getCLIIdToLabel() {
    const mapping: { [shortSha: string]: string } = {}

    for (const rev of this.experiments.getRevisions()) {
      mapping[this.getCLIId(rev)] = rev
    }

    return mapping
  }

  private removeStaleData() {
    return Promise.all([this.removeStaleCommits(), this.removeStaleRevisions()])
  }

  private removeStaleRevisions() {
    const revisions = this.experiments.getRevisions()

    this.comparisonData = removeMissingKeysFromObject(
      revisions,
      this.comparisonData
    )

    this.revisionData = removeMissingKeysFromObject(
      revisions,
      this.revisionData
    )

    for (const fetchedRev of this.fetchedRevs) {
      if (!revisions.includes(fetchedRev)) {
        this.fetchedRevs.delete(fetchedRev)
      }
    }
  }

  private removeStaleCommits() {
    const currentCommitRevisions = collectCommitRevisionDetails(
      this.experiments.getCommitRevisions()
    )
    for (const id of Object.keys(this.commitRevisions)) {
      if (this.commitRevisions[id] !== currentCommitRevisions[id]) {
        this.deleteRevisionData(id)
      }
    }
    if (!isEqual(this.commitRevisions, currentCommitRevisions)) {
      this.deleteRevisionData(EXPERIMENT_WORKSPACE_ID)
    }
    this.commitRevisions = currentCommitRevisions
  }

  private deleteRevisionData(id: string) {
    delete this.revisionData[id]
    delete this.comparisonData[id]
    this.fetchedRevs.delete(id)
  }

  private getCLIId(label: string) {
    return this.commitRevisions[label] || label
  }

  private getPlots(
    checkpointPlots: CheckpointPlot[],
    selectedExperiments: string[]
  ) {
    return reorderObjectList<CheckpointPlotData>(
      this.metricOrder,
      checkpointPlots.map(plot => {
        const { id, values } = plot
        return {
          id,
          title: truncateVerticalTitle(
            id,
            this.getPlotSize(Section.CHECKPOINT_PLOTS)
          ) as string,
          values: values.filter(value =>
            selectedExperiments.includes(value.group)
          )
        }
      }),
      'id'
    )
  }

  private getSelectedComparisonPlots(
    paths: string[],
    selectedRevisions: string[]
  ) {
    const acc: ComparisonPlots = []
    for (const path of paths) {
      this.collectSelectedPathComparisonPlots(acc, path, selectedRevisions)
    }
    return acc
  }

  private collectSelectedPathComparisonPlots(
    acc: ComparisonPlots,
    path: string,
    selectedRevisions: string[]
  ) {
    const pathRevisions = {
      path,
      revisions: {} as ComparisonRevisionData
    }

    for (const revision of selectedRevisions) {
      const image = this.comparisonData?.[revision]?.[path]
      pathRevisions.revisions[revision] = {
        revision,
        url: image?.url
      }
    }
    acc.push(pathRevisions)
  }

  private getSelectedTemplatePlots(
    order: TemplateOrder,
    selectedRevisions: Revision[]
  ) {
    return collectSelectedTemplatePlots(
      order,
      selectedRevisions.map(({ revision }) => revision),
      this.templates,
      this.revisionData,
      this.getPlotSize(Section.TEMPLATE_PLOTS),
      this.getRevisionColors(selectedRevisions),
      this.multiSourceEncoding
    )
  }
}
