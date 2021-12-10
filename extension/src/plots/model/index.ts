import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { collectLivePlotsData } from './collect'
import {
  defaultSectionCollapsed,
  LivePlotData,
  PlotSize,
  SectionCollapsed
} from '../../plots/webview/contract'
import { definedAndNonEmpty } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { Experiments } from '../../experiments'

export const enum MementoPrefixes {
  SECTION_COLLAPSED = 'sectionCollapsed:',
  SELECTED_METRICS = 'selectedMetrics:',
  PLOT_SIZE = 'plotSize:'
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

  constructor(
    dvcRoot: string,
    experiments: Experiments,
    workspaceState: Memento
  ) {
    this.dvcRoot = dvcRoot
    this.experiments = experiments
    this.workspaceState = workspaceState

    this.selectedMetrics = workspaceState.get(
      MementoPrefixes.SELECTED_METRICS + dvcRoot,
      undefined
    )

    this.plotSize = workspaceState.get(
      MementoPrefixes.PLOT_SIZE + dvcRoot,
      PlotSize.REGULAR
    )

    this.sectionCollapsed = workspaceState.get(
      MementoPrefixes.SECTION_COLLAPSED + dvcRoot,
      defaultSectionCollapsed
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
      MementoPrefixes.SELECTED_METRICS + this.dvcRoot,
      this.getSelectedMetrics()
    )
  }

  private persistPlotSize() {
    this.workspaceState.update(
      MementoPrefixes.PLOT_SIZE + this.dvcRoot,
      this.getPlotSize()
    )
  }

  private persistCollapsibleState() {
    this.workspaceState.update(
      MementoPrefixes.SECTION_COLLAPSED + this.dvcRoot,
      this.sectionCollapsed
    )
  }
}
