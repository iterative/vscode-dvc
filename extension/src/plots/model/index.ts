import { Memento } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { TopLevelSpec } from 'vega-lite'
import { VisualizationSpec } from 'react-vega'
import {
  collectBranchRevision,
  collectData,
  collectLivePlotsData,
  collectMutableRevisions,
  collectPaths,
  collectRevisions,
  collectTemplates,
  ComparisonData,
  RevisionData
} from './collect'
import { Status } from './tree'
import {
  ComparisonRevisionData,
  ComparisonPlots,
  ComparisonRevisions,
  DEFAULT_SECTION_COLLAPSED,
  DEFAULT_SECTION_NAMES,
  DEFAULT_SECTION_SIZES,
  LivePlotData,
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
import { definedAndNonEmpty, flatten, uniqueValues } from '../../util/array'

export class PlotsModel {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly dvcRoot: string
  private readonly experiments: Experiments
  private readonly workspaceState: Memento

  private livePlots?: LivePlotData[]
  private selectedMetrics?: string[]
  private plotSizes: Record<Section, PlotSize>
  private sectionCollapsed: SectionCollapsed
  private sectionNames: Record<Section, string>
  private branchNames: string[] = []
  private revisionsByTip = new Map<string, string[]>()
  private revisionsByBranch = new Map<string, { id: string; name: string }[]>()
  private branchRevision = ''
  private mutableRevisions: string[] = []

  private status: Record<string, Status> = {}

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

  public isReady() {
    return this.initialized
  }

  public async transformAndSetExperiments(data: ExperimentsOutput) {
    const [livePlots, revisions, branchRevision, mutableRevisions] =
      await Promise.all([
        collectLivePlotsData(data),
        collectRevisions(data),
        collectBranchRevision(data),
        collectMutableRevisions(data, this.experiments.hasCheckpoints())
      ])

    const { branchNames, revisionsByTip, revisionsByBranch } = revisions

    const branch = branchNames[0]

    this.removeStaleBranchData(branch, branchRevision)

    this.livePlots = livePlots
    this.branchNames = branchNames
    this.revisionsByTip = revisionsByTip
    this.revisionsByBranch = revisionsByBranch
    this.mutableRevisions = mutableRevisions

    this.status = this.collectStatuses()

    this.removeStaleData()
  }

  public async transformAndSetPlots(data: PlotsOutput) {
    const [{ comparisonData, revisionData }, templates, { comparison, plots }] =
      await Promise.all([
        collectData(data),
        collectTemplates(data),
        collectPaths(data)
      ])

    this.comparisonData = { ...this.comparisonData, ...comparisonData }
    this.revisionData = { ...this.revisionData, ...revisionData }
    this.templates = { ...this.templates, ...templates }
    this.vegaPaths = plots
    this.comparisonPaths = comparison

    this.deferred.resolve()
  }

  public getLivePlots() {
    if (!this.livePlots) {
      return
    }

    const colors = getColorScale(this.getSelectedRevisions(), 'name')

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
    const colors = this.experiments.getColors() || {}

    return [
      {
        displayColor: colors.workspace,
        id: 'workspace',
        name: undefined,
        status: this.status.workspace
      },
      ...this.branchNames.map(branch => ({
        displayColor: colors[branch],
        id: branch,
        name: undefined,
        status: this.getStatus(branch)
      })),
      ...flatten(
        this.branchNames.map(branch =>
          (this.revisionsByBranch.get(branch) || []).map(({ id, name }) => ({
            displayColor: colors[id],
            id,
            name,
            status: this.getStatus(name)
          }))
        )
      )
    ]
  }

  public getMissingRevisions() {
    const cachedRevisions = [
      ...Object.keys(this.comparisonData),
      ...Object.keys(this.revisionData)
    ]

    const selectableRevisions = [
      'workspace',
      ...this.branchNames,
      ...flatten(
        this.branchNames.map(branch =>
          (this.revisionsByBranch.get(branch) || []).map(({ id }) => id)
        )
      )
    ]

    return uniqueValues(
      selectableRevisions.filter(rev => !cachedRevisions.includes(rev))
    )
  }

  public getMutableRevisions() {
    return this.mutableRevisions
  }

  public getComparisonRevisions() {
    return this.getSelectedRevisions().reduce(
      (acc, { id, displayColor: color }) => {
        if (Object.keys(this.comparisonData).includes(id)) {
          acc[id] = { color }
        }
        return acc
      },
      {} as ComparisonRevisions
    )
  }

  public getStaticPlots() {
    const selectedRevisions = this.getSelectedRevisionIds()
    if (!definedAndNonEmpty(selectedRevisions)) {
      return null
    }

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
                    selectedRevisions
                      .map(rev => this.revisionData?.[rev]?.[path])
                      .filter(Boolean)
                  )
                }
              } as TopLevelSpec,
              getColorScale(this.getSelectedRevisions(), 'id')
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

  public getComparisonPlots() {
    const selectedRevisions = this.getSelectedRevisionIds()
    if (!definedAndNonEmpty(selectedRevisions)) {
      return null
    }

    return this.comparisonPaths.reduce((acc, path) => {
      const pathRevisions = {
        path,
        revisions: {} as ComparisonRevisionData
      }
      selectedRevisions.forEach(revision => {
        const image = this.comparisonData?.[revision]?.[path]
        if (image) {
          pathRevisions.revisions[revision] = { revision, url: image.url }
        }
      })
      acc.push(pathRevisions)
      return acc
    }, [] as ComparisonPlots)
  }

  public toggleStatus(idOrName: string) {
    const status = this.getNextStatus(idOrName)
    this.status[idOrName] = status
    return status
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

  private removeStaleData() {
    const revisions = this.getRevisionIds()

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

  private getRevisionIds() {
    return this.getRevisions().map(({ id }) => id)
  }

  private getSelectedRevisions() {
    return this.getRevisions().filter(rev => rev.status === Status.SELECTED)
  }

  private getSelectedRevisionIds() {
    return this.getSelectedRevisions().map(({ id }) => id)
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

  private collectStatuses() {
    const acc: Record<string, Status> = {}

    acc.workspace = this.getStatus('workspace')

    const experiments = flatten(
      this.branchNames.map(branch => {
        acc[branch] = this.getStatus(branch)

        const revisions = this.revisionsByBranch.get(branch) || []
        revisions.map(({ name }) => (acc[name] = this.getStatus(name)))
        return revisions
      })
    )

    experiments.map(({ id }) =>
      (this.revisionsByTip.get(id) || []).map(
        id => (acc[id] = this.getStatus(id))
      )
    )

    return acc
  }

  private getStatus(idOrName: string) {
    const currentStatus = this.status[idOrName]
    return currentStatus === undefined ? Status.UNSELECTED : currentStatus
  }

  private getNextStatus(idOrName: string) {
    const status = this.status[idOrName]
    if (status === Status.SELECTED) {
      return Status.UNSELECTED
    }
    return Status.SELECTED
  }
}
