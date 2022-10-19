import { Memento } from 'vscode'
import isEqual from 'lodash.isequal'
import {
  collectCheckpointPlotsData,
  collectData,
  collectMetricOrder,
  collectWorkspaceRaceConditionData,
  collectWorkspaceRunningCheckpoint,
  collectSelectedTemplatePlots,
  collectTemplates,
  ComparisonData,
  RevisionData,
  TemplateAccumulator,
  collectBranchRevisionDetails
} from './collect'
import {
  CheckpointPlot,
  CheckpointPlotData,
  ComparisonPlots,
  Revision,
  ComparisonRevisionData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section,
  SectionCollapsed
} from '../webview/contract'
import { ExperimentsOutput, PlotsOutput } from '../../cli/dvc/contract'
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

export class PlotsModel extends ModelWithPersistence {
  private readonly experiments: Experiments

  private plotSizes: Record<Section, PlotSize>
  private sectionCollapsed: SectionCollapsed
  private branchRevisions: Record<string, string> = {}
  private workspaceRunningCheckpoint: string | undefined

  private fetchedRevs = new Set<string>()

  private comparisonData: ComparisonData = {}
  private comparisonOrder: string[]

  private revisionData: RevisionData = {}
  private templates: TemplateAccumulator = {}
  private multiSourceVariations: MultiSourceVariations = {}
  private multiSourceEncoding: MultiSourceEncoding = {}

  private checkpointPlots?: CheckpointPlot[]
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
      DEFAULT_SECTION_SIZES
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
  }

  public async transformAndSetExperiments(data: ExperimentsOutput) {
    const [checkpointPlots, workspaceRunningCheckpoint] = await Promise.all([
      collectCheckpointPlotsData(data),
      collectWorkspaceRunningCheckpoint(data, this.experiments.hasCheckpoints())
    ])

    if (!this.selectedMetrics && checkpointPlots) {
      this.selectedMetrics = checkpointPlots.map(({ id }) => id)
    }

    this.checkpointPlots = checkpointPlots
    this.workspaceRunningCheckpoint = workspaceRunningCheckpoint

    this.setMetricOrder()

    return this.removeStaleData()
  }

  public async transformAndSetPlots(data: PlotsOutput, revs: string[]) {
    const cliIdToLabel = this.getCLIIdToLabel()

    this.fetchedRevs = new Set([
      ...this.fetchedRevs,
      ...revs.map(rev => cliIdToLabel[rev])
    ])

    const [{ comparisonData, revisionData }, templates, multiSourceVariations] =
      await Promise.all([
        collectData(data, cliIdToLabel),
        collectTemplates(data),
        collectMultiSourceVariations(data, this.multiSourceVariations)
      ])

    const { overwriteComparisonData, overwriteRevisionData } =
      collectWorkspaceRaceConditionData(
        this.workspaceRunningCheckpoint,
        { ...this.comparisonData, ...comparisonData },
        { ...this.revisionData, ...revisionData }
      )

    this.comparisonData = {
      ...this.comparisonData,
      ...comparisonData,
      ...overwriteComparisonData
    }
    this.revisionData = {
      ...this.revisionData,
      ...revisionData,
      ...overwriteRevisionData
    }
    this.templates = { ...this.templates, ...templates }
    this.multiSourceVariations = multiSourceVariations
    this.multiSourceEncoding = collectMultiSourceEncoding(
      this.multiSourceVariations
    )

    this.setComparisonOrder()

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
      plots: this.getPlots(this.checkpointPlots, selectedExperiments),
      selectedMetrics: this.getSelectedMetrics(),
      size: this.getPlotSize(Section.CHECKPOINT_PLOTS)
    }
  }

  public setupManualRefresh(id: string) {
    this.deleteRevisionData(id)
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

  public getRevisionColors() {
    return getColorScale(this.getSelectedRevisionDetails())
  }

  public getSelectedRevisionDetails() {
    return reorderObjectList<Revision>(
      this.comparisonOrder,
      this.experiments
        .getSelectedRevisions()
        .map(({ label, displayColor, logicalGroupName, id }) => ({
          displayColor,
          group: logicalGroupName,
          id,
          revision: label
        })),
      'revision'
    )
  }

  public getTemplatePlots(order: TemplateOrder | undefined) {
    if (!definedAndNonEmpty(order)) {
      return
    }

    const selectedRevisions = this.getSelectedRevisions()

    if (!definedAndNonEmpty(selectedRevisions)) {
      return
    }

    return this.getSelectedTemplatePlots(order, selectedRevisions)
  }

  public getComparisonPlots(paths: string[] | undefined) {
    if (!paths) {
      return
    }

    const selectedRevisions = this.getSelectedRevisions()
    if (!definedAndNonEmpty(selectedRevisions)) {
      return
    }

    return this.getSelectedComparisonPlots(paths, selectedRevisions)
  }

  public setComparisonOrder(revisions: string[] = this.comparisonOrder) {
    const currentRevisions = this.getSelectedRevisions()

    this.comparisonOrder = revisions.filter(revision =>
      currentRevisions.includes(revision)
    )

    currentRevisions.map(revision => {
      if (!this.comparisonOrder.includes(revision)) {
        this.comparisonOrder.push(revision)
      }
    })

    this.persist(PersistenceKey.PLOT_COMPARISON_ORDER, this.comparisonOrder)
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

  public setPlotSize(section: Section, size: PlotSize) {
    this.plotSizes[section] = size
    this.persist(PersistenceKey.PLOT_SIZES, this.plotSizes)
  }

  public getPlotSize(section: Section) {
    return this.plotSizes[section]
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

  private removeStaleData() {
    return Promise.all([
      this.removeStaleBranches(),
      this.removeStaleRevisions()
    ])
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

  private removeStaleBranches() {
    const currentBranchRevisions = collectBranchRevisionDetails(
      this.experiments.getBranchRevisions()
    )
    for (const id of Object.keys(this.branchRevisions)) {
      if (this.branchRevisions[id] !== currentBranchRevisions[id]) {
        this.deleteRevisionData(id)
      }
    }
    if (!isEqual(this.branchRevisions, currentBranchRevisions)) {
      this.deleteRevisionData('workspace')
    }
    this.branchRevisions = currentBranchRevisions
  }

  private deleteRevisionData(id: string) {
    delete this.revisionData[id]
    delete this.comparisonData[id]
    this.fetchedRevs.delete(id)
  }

  private getCLIIdToLabel() {
    const mapping: { [shortSha: string]: string } = {}

    for (const rev of this.getSelectedRevisions()) {
      mapping[this.getCLIId(rev)] = rev
    }

    return mapping
  }

  private getCLIId(label: string) {
    return this.branchRevisions[label] || label
  }

  private getSelectedRevisions() {
    return this.experiments.getSelectedRevisions().map(({ label }) => label)
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
    selectedRevisions: string[]
  ) {
    return collectSelectedTemplatePlots(
      order,
      selectedRevisions,
      this.templates,
      this.revisionData,
      this.getPlotSize(Section.TEMPLATE_PLOTS),
      this.getRevisionColors(),
      this.multiSourceEncoding
    )
  }
}
