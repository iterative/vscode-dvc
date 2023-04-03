import { Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import isEqual from 'lodash.isequal'
import {
  collectData,
  collectSelectedTemplatePlots,
  collectTemplates,
  ComparisonData,
  RevisionData,
  TemplateAccumulator,
  collectCommitRevisionDetails,
  collectOverrideRevisionDetails,
  collectCustomPlots,
  getCustomPlotId,
  collectOrderedRevisions,
  collectImageUrl,
  CLIRevisionIdToLabel
} from './collect'
import { getRevisionFirstThreeColumns } from './util'
import {
  checkForCustomPlotOptions,
  cleanupOldOrderValue,
  CustomPlotsOrderValue
} from './custom'
import {
  CheckpointPlot,
  ComparisonPlots,
  Revision,
  ComparisonRevisionData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NB_ITEMS_PER_ROW_OR_WIDTH,
  PlotsSection,
  SectionCollapsed,
  CustomPlotData,
  CustomPlotsData,
  DEFAULT_HEIGHT,
  DEFAULT_NB_ITEMS_PER_ROW,
  PlotHeight
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
import { ErrorsModel } from '../errors/model'

export type CustomCheckpointPlots = { [metric: string]: CheckpointPlot }

export class PlotsModel extends ModelWithPersistence {
  private readonly experiments: Experiments
  private readonly errors: ErrorsModel

  private nbItemsPerRowOrWidth: Record<PlotsSection, number>
  private height: Record<PlotsSection, PlotHeight>
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

    this.cleanupOutdatedCustomPlotsState()
    this.cleanupOutdatedTrendsState()
  }

  public transformAndSetExperiments() {
    return this.removeStaleData()
  }

  public async transformAndSetPlots(
    output: PlotsOutputOrError,
    revs: string[]
  ) {
    const cliIdToLabel = this.getCLIIdToLabel()

    if (isDvcError(output)) {
      this.handleCliError()
    } else {
      await this.processOutput(output, revs, cliIdToLabel)
    }
    this.setComparisonOrder()

    this.fetchedRevs = new Set(revs.map(rev => cliIdToLabel[rev]))

    this.experiments.setRevisionCollected(revs)

    this.deferred.resolve()
  }

  public getCustomPlots(): CustomPlotsData | undefined {
    const experiments = this.experiments
      .getExperimentsWithCheckpoints()
      .filter(({ id }) => id !== EXPERIMENT_WORKSPACE_ID)

    if (experiments.length === 0) {
      return
    }

    const colors = getColorScale(
      this.experiments
        .getSelectedExperiments()
        .map(({ displayColor, id: revision }) => ({ displayColor, revision }))
    )
    const height = this.getHeight(PlotsSection.CUSTOM_PLOTS)
    const nbItemsPerRow = this.getNbItemsPerRowOrWidth(
      PlotsSection.CUSTOM_PLOTS
    )
    const plotsOrderValues = this.getCustomPlotsOrder()
    const plots: CustomPlotData[] = collectCustomPlots({
      experiments,
      hasCheckpoints: this.experiments.hasCheckpoints(),
      height,
      nbItemsPerRow,
      plotsOrderValues,
      selectedRevisions: colors?.domain
    })

    if (plots.length === 0 && plotsOrderValues.length > 0) {
      return
    }

    return {
      colors,
      enablePlotCreation: checkForCustomPlotOptions(
        this.experiments.getColumnTerminalNodes(),
        plotsOrderValues
      ),
      height,
      nbItemsPerRow,
      plots
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
        new Set([
          ...Object.keys(this.comparisonData),
          ...Object.keys(this.revisionData)
        ]),
        finishedExperiments,
        id => this.experiments.getCheckpoints(id),
        label => this.errors.getRevisionErrors(label),
        this.experiments.getFirstThreeColumnOrder()
      )
    }

    return {
      overrideComparison: this.getComparisonRevisions(),
      overrideRevisions: this.getSelectedRevisionDetails()
    }
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
        errors: this.errors.getRevisionErrors(label),
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

  public requiresUpdate() {
    return !sameContents([...this.fetchedRevs], this.getSelectedRevisions())
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

  public getSelectedOrderedCliIds() {
    return collectOrderedRevisions(this.experiments.getSelectedRevisions()).map(
      ({ label }) => this.getCLIId(label)
    )
  }

  public setNbItemsPerRowOrWidth(section: PlotsSection, nbItemsPerRow: number) {
    this.nbItemsPerRowOrWidth[section] = nbItemsPerRow
    this.persist(
      PersistenceKey.PLOT_NB_ITEMS_PER_ROW_OR_WIDTH,
      this.nbItemsPerRowOrWidth
    )
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

  public getCLIIdToLabel() {
    const mapping: { [shortSha: string]: string } = {}

    for (const rev of this.experiments.getRevisions()) {
      mapping[this.getCLIId(rev)] = rev
    }

    return mapping
  }

  private handleCliError() {
    this.comparisonData = {}
    this.revisionData = {}
    this.templates = {}
    this.multiSourceVariations = {}
    this.multiSourceEncoding = {}
  }

  private async processOutput(
    output: PlotsOutput,
    revs: string[],
    cliIdToLabel: CLIRevisionIdToLabel
  ) {
    for (const rev of revs) {
      this.deleteRevisionData(cliIdToLabel[rev] || rev)
    }

    const [{ comparisonData, revisionData }, templates, multiSourceVariations] =
      await Promise.all([
        collectData(output, cliIdToLabel),
        collectTemplates(output),
        collectMultiSourceVariations(output, this.multiSourceVariations)
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
    const workspaceHoldsUpToDateState =
      order.length === 0 || order[0].type !== undefined
    if (workspaceHoldsUpToDateState) {
      return
    }
    const newOrder = order.map(value => cleanupOldOrderValue(value))
    this.setCustomPlotsOrder(newOrder)
  }

  private cleanupOutdatedTrendsState() {
    this.persist(PersistenceKey.PLOT_METRIC_ORDER, undefined)
    this.persist(PersistenceKey.PLOT_SELECTED_METRICS, undefined)
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
  }

  private removeStaleCommits() {
    const currentCommitRevisions = collectCommitRevisionDetails(
      this.experiments.getCommitRevisions()
    )
    for (const id of Object.keys(this.commitRevisions)) {
      if (this.commitRevisions[id] !== currentCommitRevisions[id]) {
        this.deleteRevisionData(id)
        this.fetchedRevs.delete(id)
      }
    }
    if (!isEqual(this.commitRevisions, currentCommitRevisions)) {
      this.deleteRevisionData(EXPERIMENT_WORKSPACE_ID)
      this.fetchedRevs.delete(EXPERIMENT_WORKSPACE_ID)
    }
    this.commitRevisions = currentCommitRevisions
  }

  private deleteRevisionData(id: string) {
    delete this.revisionData[id]
    delete this.comparisonData[id]
  }

  private getCLIId(label: string) {
    return this.commitRevisions[label] || label
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
      const errors = this.errors.getImageErrors(path, revision)
      const fetched = this.fetchedRevs.has(revision)
      const url = collectImageUrl(image, fetched)
      const loading = !fetched && !url
      pathRevisions.revisions[revision] = {
        errors,
        loading,
        revision,
        url
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
      this.getNbItemsPerRowOrWidth(PlotsSection.TEMPLATE_PLOTS),
      this.getHeight(PlotsSection.TEMPLATE_PLOTS),
      this.getRevisionColors(selectedRevisions),
      this.multiSourceEncoding
    )
  }
}
