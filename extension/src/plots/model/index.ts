import { Memento } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { TopLevelSpec } from 'vega-lite'
import { VisualizationSpec } from 'react-vega'
import {
  collectCheckpointPlotsData,
  collectData,
  collectTemplates,
  ComparisonData,
  RevisionData
} from './collect'
import {
  CheckpointPlotData,
  ComparisonRevisionData,
  ComparisonPlots,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  PlotSize,
  PlotsType,
  Section,
  SectionCollapsed,
  VegaPlots
} from '../../plots/webview/contract'
import { ExperimentsOutput, PlotsOutput } from '../../cli/reader'
import { Experiments } from '../../experiments'
import { MementoPrefix } from '../../vscode/memento'
import { extendVegaSpec, getColorScale, isMultiViewPlot } from '../vega/util'
import { definedAndNonEmpty, flatten } from '../../util/array'

export class PlotsModel {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly dvcRoot: string
  private readonly experiments: Experiments
  private readonly workspaceState: Memento

  private checkpointPlots?: CheckpointPlotData[]
  private selectedMetrics?: string[]
  private plotSizes: Record<Section, PlotSize>
  private sectionCollapsed: SectionCollapsed
  private sectionNames: Record<Section, string>
  private branchRevisions: Record<string, string> = {}

  private comparisonData: ComparisonData = {}
  private revisionData: RevisionData = {}
  private templates: Record<string, VisualizationSpec> = {}

  constructor(
    dvcRoot: string,
    experiments: Experiments,
    workspaceState: Memento
  ) {
    this.dvcRoot = dvcRoot
    this.experiments = experiments
    this.workspaceState = workspaceState

    this.selectedMetrics = workspaceState.get(
      MementoPrefix.PLOT_SELECTED_METRICS + dvcRoot,
      undefined
    )

    this.plotSizes = workspaceState.get(
      MementoPrefix.PLOT_SIZES + dvcRoot,
      DEFAULT_SECTION_SIZES
    )

    this.sectionCollapsed = workspaceState.get(
      MementoPrefix.PLOT_SECTION_COLLAPSED + dvcRoot,
      DEFAULT_SECTION_COLLAPSED
    )

    this.sectionNames = workspaceState.get(
      MementoPrefix.PLOT_SECTION_NAMES + dvcRoot,
      DEFAULT_SECTION_NAMES
    )
  }

  public isReady() {
    return this.initialized
  }

  public transformAndSetExperiments(data: ExperimentsOutput) {
    const checkpointPlots = collectCheckpointPlotsData(data)

    this.checkpointPlots = checkpointPlots

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
    const cachedRevisions = [
      ...Object.keys(this.comparisonData),
      ...Object.keys(this.revisionData)
    ]

    return this.getSelectedRevisions().filter(
      revision => !cachedRevisions.includes(revision)
    )
  }

  public getMutableRevisions() {
    return this.experiments.getMutableRevisions()
  }

  public getRevisionColors() {
    return getColorScale(this.getSelectedRevisionDetails())
  }

  public getSelectedRevisionDetails() {
    return this.experiments
      .getSelectedRevisions()
      .map(({ label: revision, displayColor }) => ({ displayColor, revision }))
  }

  public getTemplatePlots(paths: string[] | undefined) {
    if (!paths) {
      return
    }

    const selectedRevisions = this.getSelectedRevisions()

    if (!definedAndNonEmpty(selectedRevisions)) {
      return
    }

    return paths.reduce((acc, path) => {
      const template = this.templates[path]

      if (template) {
        acc[path] = [
          {
            content: extendVegaSpec(
              {
                ...template,
                data: {
                  values: flatten(
                    selectedRevisions
                      .map(revision => this.revisionData?.[revision]?.[path])
                      .filter(Boolean)
                  )
                }
              } as TopLevelSpec,
              this.getRevisionColors()
            ),
            multiView: isMultiViewPlot(template as TopLevelSpec),
            revisions: selectedRevisions,
            type: PlotsType.VEGA
          }
        ]
      }
      return acc
    }, {} as VegaPlots)
  }

  public getComparisonPlots(paths: string[] | undefined) {
    if (!paths) {
      return
    }

    const selectedRevisions = this.getSelectedRevisions()
    if (!definedAndNonEmpty(selectedRevisions)) {
      return
    }

    return paths.reduce((acc, path) => {
      const pathRevisions = {
        path,
        revisions: {} as ComparisonRevisionData
      }

      selectedRevisions.forEach(revision => {
        const image = this.comparisonData?.[revision]?.[path]
        if (image) {
          pathRevisions.revisions[revision] = {
            revision,
            url: image.url
          }
        }
      })
      acc.push(pathRevisions)
      return acc
    }, [] as ComparisonPlots)
  }

  public setSelectedMetrics(selectedMetrics: string[]) {
    this.selectedMetrics = selectedMetrics
    this.persistSelectedMetrics()
  }

  public getSelectedMetrics() {
    return this.selectedMetrics
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

    Object.keys(this.comparisonData).map(revision => {
      if (!revisions.includes(revision)) {
        delete this.comparisonData[revision]
      }
    })
    Object.keys(this.revisionData).map(revision => {
      if (!revisions.includes(revision)) {
        delete this.revisionData[revision]
      }
    })
  }

  private removeStaleBranches() {
    this.experiments.getBranchRevisions().forEach(({ id, sha }) => {
      if (sha && this.branchRevisions[id] !== sha) {
        delete this.revisionData[id]
        delete this.comparisonData[id]
        this.branchRevisions[id] = sha
      }
    })
  }

  private getSelectedRevisions() {
    return this.experiments.getSelectedRevisions().map(({ label }) => label)
  }

  private getPlots(
    checkpointPlots: CheckpointPlotData[],
    selectedExperiments: string[]
  ) {
    return checkpointPlots.map(plot => {
      const { title, values } = plot
      return {
        title,
        values: values.filter(value =>
          selectedExperiments.includes(value.group)
        )
      }
    })
  }

  private persistSelectedMetrics() {
    return this.workspaceState.update(
      MementoPrefix.PLOT_SELECTED_METRICS + this.dvcRoot,
      this.getSelectedMetrics()
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
}
