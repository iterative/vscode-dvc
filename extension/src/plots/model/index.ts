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
  Section,
  SectionCollapsed,
  PlotSizeNumber
} from '../webview/contract'
import { ExperimentsOutput, PlotsOutput } from '../../cli/dvc/contract'
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
import { SelectedExperimentWithColor } from '../../experiments/model'

export class PlotsModel extends ModelWithPersistence {
  private plotSizes: Record<Section, number>
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

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(dvcRoot, workspaceState)

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

  public async transformAndSetExperiments(
    data: ExperimentsOutput,
    branchRevisions: {
      id: string
      sha: string | undefined
    }[],
    revisions: string[],
    hasCheckpoints = false
  ) {
    const [checkpointPlots, workspaceRunningCheckpoint] = await Promise.all([
      collectCheckpointPlotsData(data),
      collectWorkspaceRunningCheckpoint(data, hasCheckpoints)
    ])

    if (!this.selectedMetrics && checkpointPlots) {
      this.selectedMetrics = checkpointPlots.map(({ id }) => id)
    }

    this.checkpointPlots = checkpointPlots
    this.workspaceRunningCheckpoint = workspaceRunningCheckpoint

    this.setMetricOrder()

    return this.removeStaleData(branchRevisions, revisions)
  }

  public async transformAndSetPlots(
    data: PlotsOutput,
    newRevs: string[],
    selectedRevs: SelectedExperimentWithColor[]
  ) {
    if (data.error) {
      return
    }

    const cliIdToLabel = this.getCLIIdToLabel(selectedRevs)

    this.fetchedRevs = new Set([
      ...this.fetchedRevs,
      ...newRevs.map(rev => cliIdToLabel[rev])
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

    this.setComparisonOrder(selectedRevs)

    this.deferred.resolve()
  }

  public getCheckpointPlots(
    selectedExperiments: SelectedExperimentWithColor[]
  ) {
    if (!this.checkpointPlots) {
      return
    }

    const colors = getColorScale(
      selectedExperiments.map(({ displayColor, id: revision }) => ({
        displayColor,
        revision
      }))
    )

    if (!colors) {
      return
    }

    const { domain } = colors

    return {
      colors,
      plots: this.getPlots(this.checkpointPlots, domain),
      selectedMetrics: this.getSelectedMetrics(),
      size: this.getPlotSize(Section.CHECKPOINT_PLOTS)
    }
  }

  public setupManualRefresh(id: string) {
    this.deleteRevisionData(id)
  }

  public getMissingRevisions(selectedRevs: SelectedExperimentWithColor[]) {
    const cachedRevisions = new Set([
      ...Object.keys(this.comparisonData),
      ...Object.keys(this.revisionData)
    ])

    return this.getSelectedRevisions(selectedRevs)
      .filter(label => !cachedRevisions.has(label))
      .map(label => this.getCLIId(label))
  }

  public getRevisionColors(selectedRevs: SelectedExperimentWithColor[]) {
    return getColorScale(this.getSelectedRevisionDetails(selectedRevs))
  }

  public getSelectedRevisionDetails(
    selectedRevs: SelectedExperimentWithColor[]
  ) {
    return reorderObjectList<Revision>(
      this.comparisonOrder,
      selectedRevs.map(({ label, displayColor, logicalGroupName, id }) => ({
        displayColor,
        group: logicalGroupName,
        id,
        revision: label
      })),
      'revision'
    )
  }

  public getTemplatePlots(
    order: TemplateOrder | undefined,
    selectedRevs: SelectedExperimentWithColor[]
  ) {
    if (!definedAndNonEmpty(order)) {
      return
    }

    if (!definedAndNonEmpty(selectedRevs)) {
      return
    }

    return this.getSelectedTemplatePlots(order, selectedRevs)
  }

  public getComparisonPlots(
    paths: string[] | undefined,
    selectedRevs: SelectedExperimentWithColor[]
  ) {
    if (!paths) {
      return
    }

    const selectedRevisions = this.getSelectedRevisions(selectedRevs)
    if (!definedAndNonEmpty(selectedRevisions)) {
      return
    }

    return this.getSelectedComparisonPlots(paths, selectedRevisions)
  }

  public setComparisonOrder(
    selectedRevs: SelectedExperimentWithColor[],
    revisions: string[] = this.comparisonOrder
  ) {
    const currentRevisions = this.getSelectedRevisions(selectedRevs)

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

  public setPlotSize(section: Section, size: number) {
    this.plotSizes[section] = size
    this.persist(PersistenceKey.PLOT_SIZES, this.plotSizes)
  }

  public getPlotSize(section: Section) {
    if (
      this.plotSizes[section] &&
      [
        PlotSizeNumber.LARGE,
        PlotSizeNumber.REGULAR,
        PlotSizeNumber.SMALL,
        PlotSizeNumber.SMALLER
      ].includes(this.plotSizes[section])
    ) {
      return this.plotSizes[section]
    }
    return PlotSizeNumber.REGULAR
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

  public getSelectedRevisions(selectedRevs: SelectedExperimentWithColor[]) {
    return selectedRevs.map(({ label }) => label)
  }

  private removeStaleData(
    branchRevisions: {
      id: string
      sha: string | undefined
    }[],
    revisions: string[]
  ) {
    return Promise.all([
      this.removeStaleBranches(branchRevisions),
      this.removeStaleRevisions(revisions)
    ])
  }

  private removeStaleRevisions(revisions: string[]) {
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

  private removeStaleBranches(
    branchRevisions: {
      id: string
      sha: string | undefined
    }[]
  ) {
    const currentBranchRevisions = collectBranchRevisionDetails(branchRevisions)
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

  private getCLIIdToLabel(selectedRevs: SelectedExperimentWithColor[]) {
    const mapping: { [shortSha: string]: string } = {}

    for (const rev of this.getSelectedRevisions(selectedRevs)) {
      mapping[this.getCLIId(rev)] = rev
    }

    return mapping
  }

  private getCLIId(label: string) {
    return this.branchRevisions[label] || label
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
    selectedRevs: SelectedExperimentWithColor[]
  ) {
    return collectSelectedTemplatePlots(
      order,
      this.getSelectedRevisions(selectedRevs),
      this.templates,
      this.revisionData,
      this.getPlotSize(Section.TEMPLATE_PLOTS),
      this.getRevisionColors(selectedRevs),
      this.multiSourceEncoding
    )
  }
}
