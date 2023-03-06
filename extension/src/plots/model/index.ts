import { Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import isEqual from 'lodash.isequal'
import {
  collectCheckpointPlotsData,
  collectData,
  collectSelectedTemplatePlots,
  collectTemplates,
  ComparisonData,
  RevisionData,
  TemplateAccumulator,
  collectCommitRevisionDetails,
  collectOverrideRevisionDetails,
  collectCustomPlotsData,
  getCustomPlotId,
  collectCustomCheckpointPlotData,
  isCheckpointPlot
} from './collect'
import { getRevisionFirstThreeColumns } from './util'
import { CustomPlotsOrderValue } from './custom'
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
  PlotNumberOfItemsPerRow,
  DEFAULT_HEIGHT,
  CustomPlotsData,
  CustomPlot
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

export class PlotsModel extends ModelWithPersistence {
  private readonly experiments: Experiments

  private nbItemsPerRow: Record<Section, number>
  private height: Record<Section, number | undefined>
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
  // TBD we need to move this type to a named type if
  // we plan to keep this
  private customCheckpointPlots?: { [metric: string]: CheckpointPlot }
  private customPlots?: CustomPlot[]
  private selectedMetrics?: string[]
  private metricOrder: string[]

  constructor(
    dvcRoot: string,
    experiments: Experiments,
    workspaceState: Memento
  ) {
    super(dvcRoot, workspaceState)
    this.experiments = experiments

    this.nbItemsPerRow = this.revive(
      PersistenceKey.PLOT_NB_ITEMS_PER_ROW,
      DEFAULT_SECTION_NB_ITEMS_PER_ROW
    )
    this.height = this.revive(PersistenceKey.PLOT_HEIGHT, DEFAULT_HEIGHT)

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

    this.recreateCustomPlots(data)

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
      height: this.getHeight(Section.CHECKPOINT_PLOTS),
      nbItemsPerRow: this.getNbItemsPerRow(Section.CHECKPOINT_PLOTS),
      plots: this.getPlots(this.checkpointPlots, selectedExperiments),
      selectedMetrics: this.getSelectedMetrics()
    }
  }

  public getCustomPlots(): CustomPlotsData | undefined {
    if (!this.customPlots) {
      return
    }

    // TBD colors is undefined if there are no selected exps
    const colors = getColorScale(
      this.experiments
        .getSelectedExperiments()
        .map(({ displayColor, id: revision }) => ({ displayColor, revision }))
    )

    return {
      colors,
      height: this.getHeight(Section.CUSTOM_PLOTS),
      nbItemsPerRow: this.getNbItemsPerRow(Section.CUSTOM_PLOTS),
      plots: this.getCustomPlotData(this.customPlots, colors?.domain)
    }
  }

  public recreateCustomPlots(data?: ExperimentsOutput) {
    if (data) {
      this.customCheckpointPlots = collectCustomCheckpointPlotData(data)
    }
    const experiments = this.experiments.getExperiments()
    // TBD this if check is going to nned to be rethought since checkpoint data
    // is involved now
    if (experiments.length === 0) {
      this.customPlots = undefined
      return
    }
    const customPlots: CustomPlot[] = collectCustomPlotsData(
      this.getCustomPlotsOrder(),
      this.customCheckpointPlots || {},
      experiments
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
      plot => !plotIds.includes(getCustomPlotId(plot))
    )

    this.setCustomPlotsOrder(newCustomPlotsOrder)
  }

  public addCustomPlot(value: CustomPlotsOrderValue) {
    const newCustomPlotsOrder = [...this.getCustomPlotsOrder(), value]
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
    this.persist(
      PersistenceKey.PLOT_SELECTED_METRICS,
      this.getSelectedMetrics()
    )
  }

  public getSelectedMetrics() {
    return this.selectedMetrics
  }

  public setNbItemsPerRow(section: Section, nbItemsPerRow: number) {
    this.nbItemsPerRow[section] = nbItemsPerRow
    this.persist(PersistenceKey.PLOT_NB_ITEMS_PER_ROW, this.nbItemsPerRow)
  }

  public getNbItemsPerRow(section: Section) {
    if (
      this.nbItemsPerRow[section] &&
      [
        PlotNumberOfItemsPerRow.ONE,
        PlotNumberOfItemsPerRow.TWO,
        PlotNumberOfItemsPerRow.THREE,
        PlotNumberOfItemsPerRow.FOUR
      ].includes(this.nbItemsPerRow[section])
    ) {
      return this.nbItemsPerRow[section]
    }
    return PlotNumberOfItemsPerRow.TWO
  }

  public setHeight(section: Section, height: number | undefined) {
    this.height[section] = height
    this.persist(PersistenceKey.PLOT_HEIGHT, this.height)
  }

  public getHeight(section: Section) {
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
        const { id, values, type } = plot
        return {
          id,
          metric: id,
          type,
          values: values.filter(value =>
            selectedExperiments.includes(value.group)
          ),
          yTitle: truncateVerticalTitle(
            id,
            this.getNbItemsPerRow(Section.CHECKPOINT_PLOTS)
          ) as string
        }
      }),
      'id'
    )
  }

  private getCustomPlotData(
    plots: CustomPlot[],
    selectedExperiments: string[] | undefined
  ): CustomPlotData[] {
    if (!selectedExperiments) {
      return plots.filter(plot => !isCheckpointPlot(plot)) as CustomPlotData[]
    }
    return plots.map(
      plot =>
        ({
          ...plot,
          values: isCheckpointPlot(plot)
            ? plot.values.filter(value =>
                selectedExperiments.includes(value.group)
              )
            : plot.values,
          yTitle: truncateVerticalTitle(
            plot.metric,
            this.getNbItemsPerRow(Section.CUSTOM_PLOTS)
          ) as string
        } as CustomPlotData)
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
      this.getNbItemsPerRow(Section.TEMPLATE_PLOTS),
      this.getRevisionColors(selectedRevisions),
      this.multiSourceEncoding
    )
  }
}
