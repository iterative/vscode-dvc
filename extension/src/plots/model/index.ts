import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { VisualizationSpec } from 'react-vega'
import { TopLevelSpec } from 'vega-lite'
import isEmpty from 'lodash.isempty'
import {
  collectLivePlotsData,
  collectRevisionData,
  collectRevisions,
  collectTemplates,
  RevisionData
} from './collect'
import {
  defaultSectionCollapsed,
  ImagePlot,
  LivePlotData,
  PlotSize,
  PlotsOutput,
  PlotsType,
  Section,
  SectionCollapsed,
  StaticPlot
} from '../../plots/webview/contract'
import { ExperimentsOutput } from '../../cli/reader'
import { Experiments } from '../../experiments'
import { MementoPrefix } from '../../vscode/memento'
import { extendVegaSpec, getColorScale } from '../vega/util'
import { flatten } from '../../util/array'

export const DefaultSectionNames = {
  [Section.LIVE_PLOTS]: 'Live Experiments Plots',
  [Section.STATIC_PLOTS]: 'Static Plots'
}

export const DefaultSectionSizes = {
  [Section.LIVE_PLOTS]: PlotSize.REGULAR,
  [Section.STATIC_PLOTS]: PlotSize.REGULAR
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

  private revisionData: RevisionData = {}
  private templates: Record<string, VisualizationSpec> = {}
  private paths: string[] = []

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

  public async transformAndSetPlots(data: PlotsOutput) {
    const [revisionData, templates] = await Promise.all([
      collectRevisionData(data),
      collectTemplates(data)
    ])

    this.paths = Object.keys(data)

    this.revisionData = { ...this.revisionData, ...revisionData }
    this.templates = { ...this.templates, ...templates }
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

  public getStaticPlots() {
    if (isEmpty(this.paths)) {
      return null
    }

    const revisions =
      this.revisions.length === 1
        ? ['workspace', ...this.revisions]
        : this.revisions

    const plots = this.paths.reduce((acc, path) => {
      const template = { ...this.templates[path] }
      if (isEmpty(template)) {
        acc[path] = revisions.map(
          rev =>
            ({
              ...this.revisionData[rev][path],
              type: PlotsType.IMAGE
            } as ImagePlot)
        )
        return acc
      }
      const data = {
        values: flatten(
          revisions.map(rev => this.revisionData[rev][path] as unknown[])
        )
      }

      acc[path] = [
        {
          content: extendVegaSpec(
            { ...template, data } as TopLevelSpec,
            this.getRevisionColors()
          ),
          type: PlotsType.VEGA
        } as StaticPlot
      ]
      return acc
    }, {} as PlotsOutput)

    return {
      plots,
      sectionName: this.getSectionName(Section.STATIC_PLOTS),
      size: this.getPlotSize(Section.STATIC_PLOTS)
    }
  }

  public getRevisions() {
    return this.revisions
  }

  public getMissingRevisions() {
    // need to check whether the branch(s) commit has changed
    return this.revisions.filter(
      rev => !Object.keys(this.revisionData).includes(rev)
    )
  }

  public getRevisionColors() {
    return getColorScale(this.experiments?.getColors() || {})
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
