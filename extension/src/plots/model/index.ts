import { Memento, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { TopLevelSpec } from 'vega-lite'
import { VisualizationSpec } from 'react-vega'
import {
  collectBranchRevision,
  collectData,
  collectLivePlotsData,
  collectPaths,
  collectRevisions,
  collectTemplates,
  ComparisonData,
  RevisionData
} from './collect'
import {
  ComparisonPlots,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  LivePlotData,
  PlotSize,
  PlotsOutput,
  PlotsType,
  Section,
  SectionCollapsed,
  VegaPlots
} from '../../plots/webview/contract'
import { ExperimentsOutput } from '../../cli/reader'
import { Experiments } from '../../experiments'
import { MementoPrefix } from '../../vscode/memento'
import { extendVegaSpec, getColorScale, isMultiViewPlot } from '../vega/util'
import { flatten, uniqueValues } from '../../util/array'
import { deleteTarget } from '../../fileSystem/workspace'

export class PlotsModel {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly experiments: Experiments
  private readonly workspaceState: Memento

  private livePlots?: LivePlotData[]
  private selectedMetrics?: string[]
  private plotSizes: Record<Section, PlotSize>
  private sectionCollapsed: SectionCollapsed
  private sectionNames: Record<Section, string>
  private revisions: string[] = []
  private branchRevision = ''

  private vegaPaths: string[] = []
  private comparisonPaths: string[] = []
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

  public async transformAndSetExperiments(data: ExperimentsOutput) {
    const [livePlots, revisions, branchRevision] = await Promise.all([
      collectLivePlotsData(data),
      collectRevisions(data),
      collectBranchRevision(data)
    ])

    const [branch, ...experiments] = revisions

    this.removeStaleBranchData(branch, branchRevision)
    this.removeStaleData(experiments)

    this.livePlots = livePlots
    this.revisions = revisions
  }

  public async transformAndSetPlots(data: PlotsOutput) {
    const [{ comparisonData, revisionData }, templates, { plots, images }] =
      await Promise.all([
        collectData(data),
        collectTemplates(data),
        collectPaths(data)
      ])

    this.comparisonData = { ...this.comparisonData, ...comparisonData }
    this.revisionData = { ...this.revisionData, ...revisionData }
    this.templates = { ...this.templates, ...templates }
    this.vegaPaths = plots
    this.comparisonPaths = images
  }

  public getLivePlots() {
    if (!this.livePlots) {
      return
    }

    const colors = getColorScale(this.experiments.getSelectedExperiments())

    if (!colors) {
      return
    }

    const { domain: selectedExperiments } = colors

    return {
      colors,
      plots: this.getPlots(this.livePlots, selectedExperiments),
      sectionName: this.getSectionName(Section.LIVE_PLOTS),
      selectedMetrics: this.getSelectedMetrics(),
      size: this.getPlotSize(Section.LIVE_PLOTS)
    }
  }

  public getRevisions() {
    return this.revisions
  }

  public getMissingRevisions() {
    return this.revisions.filter(
      rev =>
        !uniqueValues([
          ...Object.keys(this.comparisonData),
          ...Object.keys(this.revisionData),
          'workspace'
        ]).includes(rev)
    )
  }

  public getRevisionColors() {
    return getColorScale(this.experiments?.getSelectedRevisions() || {})
  }

  public getColors() {
    const colors = { ...(this.experiments?.getSelectedRevisions() || {}) }
    Object.keys(colors).forEach(rev => {
      if (!Object.keys(this.comparisonData).includes(rev)) {
        delete colors[rev]
      }
    })
    return colors
  }

  public getStaticPlots() {
    return this.vegaPaths.reduce((acc, path) => {
      const template = this.templates[path]

      if (template) {
        acc[path] = [
          {
            content: extendVegaSpec(
              {
                ...template,
                data: {
                  values: flatten(
                    this.getSelectedRevisions()
                      .map(rev => this.revisionData?.[rev]?.[path])
                      .filter(Boolean)
                  )
                }
              } as TopLevelSpec,
              this.getRevisionColors()
            ),
            multiView: isMultiViewPlot(template as TopLevelSpec),
            revisions: this.getSelectedRevisions(),
            type: PlotsType.VEGA
          }
        ]
      }
      return acc
    }, {} as VegaPlots)
  }

  public getComparisonPlots() {
    return this.comparisonPaths.reduce((acc, path) => {
      acc[path] = []
      this.getSelectedRevisions().forEach(rev => {
        const image = this.comparisonData?.[rev]?.[path]
        if (image) {
          acc[path].push(image)
        }
      })
      return acc
    }, {} as ComparisonPlots)
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

  private removeStaleBranchData(branchName: string, branchRevision: string) {
    if (this.branchRevision !== branchRevision) {
      delete this.revisionData[branchName]
      delete this.comparisonData[branchName]
      this.branchRevision = branchRevision
    }
  }

  private removeStaleData(revisions: string[]) {
    Object.keys(this.comparisonData).map(revision => {
      if (!revisions.includes(revision)) {
        this.comparisonPaths.map(path => {
          const url = this.comparisonData[revision][path]?.url
          if (url) {
            deleteTarget(Uri.file(url))
          }
        })
        delete this.comparisonData[revision]
      }
    })

    Object.keys(this.revisionData).map(revision => {
      if (!revisions.includes(revision)) {
        delete this.revisionData[revision]
      }
    })
  }

  private getSelectedRevisions() {
    const selectedRevisions = Object.keys(
      this.experiments.getSelectedRevisions()
    )
    return this.revisions.filter(rev => selectedRevisions.includes(rev))
  }

  private getPlots(livePlots: LivePlotData[], selectedExperiments: string[]) {
    return livePlots.map(plot => {
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
