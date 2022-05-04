import { Memento } from 'vscode'
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
  collectMissingRevisions
} from './collect'
import {
  CheckpointPlotData,
  ComparisonPlots,
  ComparisonRevision,
  ComparisonRevisionData,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  Section,
  SectionCollapsed
} from '../webview/contract'
import { ExperimentsOutput, PlotsOutput } from '../../cli/reader'
import { Experiments } from '../../experiments'
import { getColorScale } from '../vega/util'
import { definedAndNonEmpty, reorderObjectList } from '../../util/array'
import { removeMissingKeysFromObject } from '../../util/object'
import { TemplateOrder } from '../paths/collect'
import { PersistenceKey } from '../../persistence/constants'
import { ModelWithPersistence } from '../../persistence/model'

export class PlotsModel extends ModelWithPersistence {
  private readonly experiments: Experiments

  private plotSizes: Record<Section, PlotSize>
  private sectionCollapsed: SectionCollapsed
  private sectionNames: Record<Section, string>
  private branchRevisions: Record<string, string> = {}
  private workspaceRunningCheckpoint: string | undefined

  private comparisonData: ComparisonData = {}
  private comparisonOrder: string[]

  private revisionData: RevisionData = {}
  private templates: TemplateAccumulator = {}

  private checkpointPlots?: CheckpointPlotData[]
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
    this.sectionNames = this.revive(
      PersistenceKey.PLOT_SECTION_NAMES,
      DEFAULT_SECTION_NAMES
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
      this.selectedMetrics = checkpointPlots.map(({ title }) => title)
    }

    this.checkpointPlots = checkpointPlots
    this.workspaceRunningCheckpoint = workspaceRunningCheckpoint

    this.setMetricOrder()

    return this.removeStaleData()
  }

  public async transformAndSetPlots(data: PlotsOutput) {
    const [{ comparisonData, revisionData }, templates] = await Promise.all([
      collectData(data),
      collectTemplates(data)
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
      sectionName: this.getSectionName(Section.CHECKPOINT_PLOTS),
      selectedMetrics: this.getSelectedMetrics(),
      size: this.getPlotSize(Section.CHECKPOINT_PLOTS)
    }
  }

  public getMissingRevisions(comparisonPaths: string[] = []) {
    return collectMissingRevisions(
      this.getSelectedRevisions(),
      comparisonPaths,
      Object.keys(this.templates),
      this.comparisonData,
      this.revisionData
    )
  }

  public getMutableRevisions() {
    return this.experiments.getMutableRevisions()
  }

  public getRevisionColors() {
    return getColorScale(this.getSelectedRevisionDetails())
  }

  public getSelectedRevisionDetails() {
    return reorderObjectList<ComparisonRevision>(
      this.comparisonOrder,
      this.experiments
        .getSelectedRevisions()
        .map(({ label: revision, displayColor }) => ({
          displayColor,
          revision
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

  public setSectionName(section: Section, name: string) {
    this.sectionNames[section] = name
    this.persist(PersistenceKey.PLOT_SECTION_NAMES, this.sectionNames)
  }

  public getSectionName(section: Section): string {
    return this.sectionNames[section] || DEFAULT_SECTION_NAMES[section]
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
  }

  private removeStaleBranches() {
    for (const { id, sha } of this.experiments.getBranchRevisions()) {
      if (sha && this.branchRevisions[id] !== sha) {
        delete this.revisionData[id]
        delete this.comparisonData[id]
        this.branchRevisions[id] = sha
      }
    }
  }

  private getSelectedRevisions() {
    return this.experiments.getSelectedRevisions().map(({ label }) => label)
  }

  private getPlots(
    checkpointPlots: CheckpointPlotData[],
    selectedExperiments: string[]
  ) {
    return reorderObjectList<CheckpointPlotData>(
      this.metricOrder,
      checkpointPlots.map(plot => {
        const { title, values } = plot
        return {
          title,
          values: values.filter(value =>
            selectedExperiments.includes(value.group)
          )
        }
      }),
      'title'
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
      if (image) {
        pathRevisions.revisions[revision] = {
          revision,
          url: image.url
        }
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
      this.getRevisionColors()
    )
  }
}
