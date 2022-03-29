import { Memento } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { VisualizationSpec } from 'react-vega'
import {
  collectCheckpointPlotsData,
  collectData,
  collectMetricOrder,
  collectSelectedTemplatePlots,
  collectTemplates,
  ComparisonData,
  RevisionData
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
} from '../../plots/webview/contract'
import { ExperimentsOutput, PlotsOutput } from '../../cli/reader'
import { Experiments } from '../../experiments'
import { MementoPrefix } from '../../vscode/memento'
import { getColorScale } from '../vega/util'
import { definedAndNonEmpty, reorderObjectList } from '../../util/array'
import { removeMissingKeysFromObject } from '../../util/object'
import { TemplateOrder } from '../paths/collect'

export class PlotsModel {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly dvcRoot: string
  private readonly experiments: Experiments
  private readonly workspaceState: Memento

  private plotSizes: Record<Section, PlotSize>
  private sectionCollapsed: SectionCollapsed
  private sectionNames: Record<Section, string>
  private branchRevisions: Record<string, string> = {}

  private comparisonData: ComparisonData = {}
  private comparisonOrder: string[]

  private revisionData: RevisionData = {}
  private templates: Record<string, VisualizationSpec> = {}

  private checkpointPlots?: CheckpointPlotData[]
  private selectedMetrics?: string[]
  private metricOrder: string[]

  constructor(
    dvcRoot: string,
    experiments: Experiments,
    workspaceState: Memento
  ) {
    this.dvcRoot = dvcRoot
    this.experiments = experiments
    this.workspaceState = workspaceState

    const {
      plotSizes,
      sectionCollapsed,
      sectionNames,
      comparisonOrder,
      selectedMetrics,
      metricOrder
    } = this.revive(dvcRoot, workspaceState)

    this.plotSizes = plotSizes
    this.sectionCollapsed = sectionCollapsed
    this.sectionNames = sectionNames
    this.comparisonOrder = comparisonOrder
    this.selectedMetrics = selectedMetrics
    this.metricOrder = metricOrder
  }

  public isReady() {
    return this.initialized
  }

  public transformAndSetExperiments(data: ExperimentsOutput) {
    const checkpointPlots = collectCheckpointPlotsData(data)

    this.checkpointPlots = checkpointPlots

    this.setMetricOrder()

    return this.removeStaleData()
  }

  public async transformAndSetPlots(data: PlotsOutput) {
    const [{ comparisonData, revisionData }, templates] = await Promise.all([
      collectData(data),
      collectTemplates(data)
    ])

    this.comparisonData = { ...this.comparisonData, ...comparisonData }
    this.revisionData = { ...this.revisionData, ...revisionData }
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

  public getMissingRevisions() {
    const cachedRevisions = new Set([
      ...Object.keys(this.comparisonData),
      ...Object.keys(this.revisionData)
    ])

    return this.getSelectedRevisions().filter(
      revision => !cachedRevisions.has(revision)
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

    this.persistComparisonOrder()
  }

  public setSelectedMetrics(selectedMetrics: string[]) {
    this.selectedMetrics = selectedMetrics
    this.setMetricOrder()
    this.persistSelectedMetrics()
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
    this.persistMetricOrder()
  }

  public setPlotSize(section: Section, size: PlotSize) {
    this.plotSizes[section] = size
    this.persistPlotSize()
  }

  public getPlotSize(section: Section) {
    return this.plotSizes[section]
  }

  public setSectionCollapsed(newState: Partial<SectionCollapsed>) {
    this.sectionCollapsed = {
      ...this.sectionCollapsed,
      ...newState
    }
    this.persistCollapsibleState()
  }

  public getSectionCollapsed() {
    return this.sectionCollapsed
  }

  public setSectionName(section: Section, name: string) {
    this.sectionNames[section] = name
    this.persistSectionNames()
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

  private persistSelectedMetrics() {
    this.workspaceState.update(
      MementoPrefix.PLOT_SELECTED_METRICS + this.dvcRoot,
      this.getSelectedMetrics()
    )
  }

  private persistMetricOrder() {
    this.workspaceState.update(
      MementoPrefix.PLOT_METRIC_ORDER + this.dvcRoot,
      this.metricOrder
    )
  }

  private persistPlotSize() {
    this.workspaceState.update(
      MementoPrefix.PLOT_SIZES + this.dvcRoot,
      this.plotSizes
    )
  }

  private persistCollapsibleState() {
    this.workspaceState.update(
      MementoPrefix.PLOT_SECTION_COLLAPSED + this.dvcRoot,
      this.sectionCollapsed
    )
  }

  private persistSectionNames() {
    this.workspaceState.update(
      MementoPrefix.PLOT_SECTION_NAMES + this.dvcRoot,
      this.sectionNames
    )
  }

  private persistComparisonOrder() {
    this.workspaceState.update(
      MementoPrefix.PLOT_COMPARISON_ORDER + this.dvcRoot,
      this.comparisonOrder
    )
  }

  private revive(dvcRoot: string, workspaceState: Memento) {
    return {
      comparisonOrder: workspaceState.get(
        MementoPrefix.PLOT_COMPARISON_ORDER + dvcRoot,
        []
      ),
      metricOrder: workspaceState.get(
        MementoPrefix.PLOT_METRIC_ORDER + dvcRoot,
        []
      ),
      plotSizes: workspaceState.get(
        MementoPrefix.PLOT_SIZES + dvcRoot,
        DEFAULT_SECTION_SIZES
      ),
      sectionCollapsed: workspaceState.get(
        MementoPrefix.PLOT_SECTION_COLLAPSED + dvcRoot,
        DEFAULT_SECTION_COLLAPSED
      ),
      sectionNames: workspaceState.get(
        MementoPrefix.PLOT_SECTION_NAMES + dvcRoot,
        DEFAULT_SECTION_NAMES
      ),
      selectedMetrics: workspaceState.get(
        MementoPrefix.PLOT_SELECTED_METRICS + dvcRoot,
        undefined
      )
    }
  }
}
