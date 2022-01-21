import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { TopLevelSpec } from 'vega-lite'
import {
  collectLivePlotsData,
  collectPaths,
  collectRevisionData,
  collectRevisions,
  ComparisonData
} from './collect'
import {
  defaultSectionCollapsed,
  ImagePlot,
  isVegaPlot,
  LivePlotData,
  PlotSize,
  PlotsOutput,
  Section,
  SectionCollapsed,
  VegaPlot
} from '../../plots/webview/contract'
import { ExperimentsOutput } from '../../cli/reader'
import { Experiments } from '../../experiments'
import { MementoPrefix } from '../../vscode/memento'
import { extendVegaSpec, getColorScale } from '../vega/util'
import { definedAndNonEmpty } from '../../util/array'

export const DefaultSectionNames = {
  [Section.LIVE_PLOTS]: 'Live Experiments Plots',
  [Section.STATIC_PLOTS]: 'Static Plots',
  [Section.COMPARISON_TABLE]: 'Comparison'
}

export const DefaultSectionSizes = {
  [Section.LIVE_PLOTS]: PlotSize.REGULAR,
  [Section.STATIC_PLOTS]: PlotSize.REGULAR,
  [Section.COMPARISON_TABLE]: PlotSize.REGULAR
}
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
  private plotsDiff?: PlotsOutput

  private plotPaths: string[] = []
  private imagePaths: string[] = []
  private comparisonData: ComparisonData = {}

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
      DefaultSectionSizes
    )

    this.sectionCollapsed = workspaceState.get(
      MementoPrefix.PLOT_SECTION_COLLAPSED + dvcRoot,
      defaultSectionCollapsed
    )

    this.sectionNames = workspaceState.get(
      MementoPrefix.PLOT_SECTION_NAMES + dvcRoot,
      DefaultSectionNames
    )
  }

  public async transformAndSetExperiments(data: ExperimentsOutput) {
    const [livePlots, revisions] = await Promise.all([
      collectLivePlotsData(data),
      collectRevisions(data)
    ])

    this.livePlots = livePlots
    this.revisions = revisions
  }

  public transformAndSetPlots(data: PlotsOutput) {
    this.plotsDiff = data

    const { comparisonData } = collectRevisionData(data)

    const { plots, images } = collectPaths(data)

    this.comparisonData = comparisonData

    this.plotPaths = plots
    this.imagePaths = images
  }

  public getPlotsDiff() {
    return this.plotsDiff
  }

  public getImagePaths() {
    return this.imagePaths
  }

  public getPlotPaths() {
    return this.plotPaths
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

  public getRevisionColors() {
    return getColorScale(this.experiments?.getColors() || {})
  }

  public getColors() {
    const colors = { ...(this.experiments?.getColors() || {}) }
    Object.keys(colors).forEach(rev => {
      if (!this.revisions.includes(rev)) {
        delete colors[rev]
      }
    })
    return colors
  }

  public getStaticPlots() {
    const data = this.getPlotsDiff()
    const paths = this.getPlotPaths()

    const staticPlots = {} as Record<string, VegaPlot[]>
    paths.forEach(path => {
      const plots = data?.[path] || []
      const allVega = plots
        .map(plot => {
          if (isVegaPlot(plot)) {
            return {
              ...plot,
              content: extendVegaSpec(
                plot.content as TopLevelSpec,
                this.getRevisionColors()
              )
            }
          }
        })
        .filter(Boolean) as VegaPlot[]
      if (definedAndNonEmpty(allVega)) {
        staticPlots[path] = allVega
      }
    })

    return staticPlots
  }

  public getComparison() {
    return this.imagePaths.reduce((acc, path) => {
      acc[path] = []
      this.revisions.forEach(rev => {
        const image = this.comparisonData?.[rev]?.[path]
        if (image) {
          acc[path].push(image)
        }
      })
      return acc
    }, {} as Record<string, ImagePlot[]>)
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
    return this.sectionNames[section] || DefaultSectionNames[section]
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
