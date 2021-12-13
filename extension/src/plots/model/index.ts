import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { collectLivePlotsData } from './collect'
import {
  defaultSectionCollapsed,
  LivePlotData,
  PlotSize,
  Section,
  SectionCollapsed
} from '../../plots/webview/contract'
import { definedAndNonEmpty } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { Experiments } from '../../experiments'
import { MementoPrefix } from '../../vscode/memento'

export const DefaultSectionNames = {
  [Section.LIVE_PLOTS]: 'Live Experiments Plots',
  [Section.STATIC_PLOTS]: 'Static Plots'
}
export class PlotsModel {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly experiments: Experiments
  private readonly workspaceState: Memento

  private livePlots?: LivePlotData[]
  private selectedMetrics?: string[] = undefined
  private plotSize: PlotSize = PlotSize.REGULAR
  private sectionCollapsed: SectionCollapsed
  private sectionNames: Record<Section, string> = DefaultSectionNames

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

    this.plotSize = workspaceState.get(
      MementoPrefix.PLOT_SIZE + dvcRoot,
      PlotSize.REGULAR
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

  public transformAndSet(data: ExperimentsOutput) {
    const livePlots = collectLivePlotsData(data)

    this.livePlots = livePlots
  }

  public getLivePlots() {
    if (!this.livePlots) {
      return
    }

    const selectedExperiments: string[] = []
    const range: string[] = []

    Object.entries(this.experiments.getSelectedExperiments()).forEach(
      ([displayName, color]) => {
        if (displayName && color) {
          selectedExperiments.push(displayName)
          range.push(color)
        }
      }
    )

    if (!definedAndNonEmpty(selectedExperiments)) {
      return
    }

    return {
      colors: { domain: selectedExperiments, range },
      plots: this.getPlots(this.livePlots, selectedExperiments),
      sectionName: this.getSectionName(Section.LIVE_PLOTS),
      selectedMetrics: this.getSelectedMetrics(),
      size: this.getPlotSize()
    }
  }

  public setSelectedMetrics(selectedMetrics: string[]) {
    this.selectedMetrics = selectedMetrics
    this.persistSelectedMetrics()
  }

  public getSelectedMetrics() {
    return this.selectedMetrics
  }

  public setPlotSize(size: PlotSize) {
    this.plotSize = size
    this.persistPlotSize()
  }

  public getPlotSize() {
    return this.plotSize
  }

  public setSectionCollapsed(newState: SectionCollapsed) {
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
    return this.sectionNames[section]
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
      MementoPrefix.PLOT_SIZE + this.dvcRoot,
      this.getPlotSize()
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
