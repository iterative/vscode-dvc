import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { SortDefinition, sortExperiments } from './sortBy'
import {
  FilterDefinition,
  filterExperiment,
  filterExperiments,
  getFilterId
} from './filterBy'
import { collectExperiments } from './collect'
import { copyOriginalColors } from './colors'
import { collectColors, Colors } from './colors/collect'
import { collectLivePlotsData } from './livePlots/collect'
import { Experiment, RowData } from '../webview/contract'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { LivePlotData, LivePlotsColors } from '../../plots/webview/contract'
import { hasKey } from '../../util/object'

export enum Status {
  selected = 1,
  unselected = 0
}

const enum MementoPrefixes {
  colors = 'colors:',
  filterBy = 'filterBy:',
  sortBy = 'sortBy:',
  status = 'status:'
}

export class ExperimentsModel {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()
  private livePlots?: LivePlotData[]
  private colors: Colors
  private status: Record<string, Status>

  private filters: Map<string, FilterDefinition> = new Map()

  private currentSorts: SortDefinition[]

  private dvcRoot: string
  private workspaceState: Memento

  constructor(dvcRoot: string, workspaceState: Memento) {
    const { colors, currentSorts, filters, status } = this.revive(
      dvcRoot,
      workspaceState
    )
    this.colors = colors
    this.currentSorts = currentSorts
    this.status = status
    this.filters = filters

    this.dvcRoot = dvcRoot

    this.workspaceState = workspaceState
  }

  public getLivePlots() {
    if (!this.livePlots || !this.colors.assigned.size) {
      return
    }

    const colors: LivePlotsColors = {
      domain: [],
      range: []
    }

    this.getAssignedColors().forEach((color: string, name: string) => {
      colors.domain.push(name)
      colors.range.push(color)
    })

    return {
      colors,
      plots: this.livePlots.map(plot => {
        const { title, values } = plot

        return {
          title,
          values: values.filter(value => this.status[value.group])
        }
      })
    }
  }

  public async transformAndSet(data: ExperimentsOutput) {
    const [
      { workspace, branches, experimentsByBranch, checkpointsByTip },
      livePlots
    ] = await Promise.all([
      collectExperiments(data),
      collectLivePlotsData(data)
    ])

    this.workspace = workspace
    this.branches = branches
    this.experimentsByBranch = experimentsByBranch
    this.checkpointsByTip = checkpointsByTip
    this.livePlots = livePlots

    this.collectColors()
  }

  public toggleStatus(experimentId: string) {
    const status = this.status[experimentId]
      ? Status.unselected
      : Status.selected
    this.status[experimentId] = status

    this.collectColors()
    this.persistStatus()
    return status
  }

  public getSorts(): SortDefinition[] {
    return this.currentSorts
  }

  public addSort(sort: SortDefinition) {
    const indexOfSortToRemove = this.findIndexByPath(sort.path)
    if (indexOfSortToRemove < 0) {
      this.currentSorts.push(sort)
    } else {
      this.currentSorts.splice(indexOfSortToRemove, 1, sort)
    }
    this.persistSorts()
  }

  public removeSorts(pathsToRemove: SortDefinition[]) {
    return pathsToRemove.map(pathToRemove => this.removeSort(pathToRemove.path))
  }

  public removeSort(pathToRemove: string) {
    const indexOfSortToRemove = this.findIndexByPath(pathToRemove)
    if (indexOfSortToRemove >= 0) {
      this.currentSorts.splice(indexOfSortToRemove, 1)
    }
    this.persistSorts()
  }

  public getFilters() {
    return [...this.filters.values()]
  }

  public addFilter(filter: FilterDefinition) {
    this.filters.set(getFilterId(filter), filter)
    this.persistFilters()
  }

  public removeFilters(filters: FilterDefinition[]) {
    filters.map(filter => this.removeFilter(getFilterId(filter)))
  }

  public removeFilter(id: string) {
    const result = this.filters.delete(id)
    this.persistFilters()
    return result
  }

  public getExperiments(): (Experiment & { hasChildren: boolean })[] {
    const workspace = this.workspace.running ? [this.workspace] : []
    return [...workspace, ...this.flattenExperiments()].map(experiment => ({
      ...this.addDisplayColor(experiment),
      hasChildren: !!this.checkpointsByTip.get(experiment.id)
    }))
  }

  public getCheckpoints(experimentId: string): Experiment[] | undefined {
    return this.checkpointsByTip
      .get(experimentId)
      ?.map(checkpoint => this.addDisplayColor(checkpoint, experimentId))
  }

  public getRowData() {
    return [
      this.workspace,
      ...this.branches.map(branch => {
        const experiments = this.getExperimentsByBranch(branch)

        if (!definedAndNonEmpty(experiments)) {
          return branch
        }
        return {
          ...branch,
          subRows: this.getSubRows(experiments)
        }
      })
    ]
  }

  private getSubRows(experiments: Experiment[]) {
    return experiments
      .map(experiment => {
        const checkpoints = this.getFilteredCheckpointsByTip(experiment.id)
        if (!checkpoints) {
          return this.addDisplayColor(experiment)
        }
        return {
          ...this.addDisplayColor(experiment),
          subRows: checkpoints.map(checkpoint =>
            this.addDisplayColor(checkpoint, experiment.id)
          )
        }
      })
      .filter((row: RowData) => this.filterTableRow(row))
  }

  private findIndexByPath(pathToRemove: string) {
    return this.currentSorts.findIndex(({ path }) => path === pathToRemove)
  }

  private filterTableRow(row: RowData): boolean {
    const hasUnfilteredCheckpoints = definedAndNonEmpty(row.subRows)
    if (hasUnfilteredCheckpoints) {
      return true
    }
    if (filterExperiment(this.getFilters(), row)) {
      return true
    }
    return false
  }

  private getFilteredCheckpointsByTip(id: string) {
    const checkpoints = this.checkpointsByTip.get(id)
    if (!checkpoints) {
      return
    }
    return filterExperiments(this.getFilters(), checkpoints)
  }

  private getExperimentsByBranch(branch: Experiment) {
    const experiments = this.experimentsByBranch.get(branch.displayName)
    if (!experiments) {
      return
    }
    return sortExperiments(this.getSorts(), experiments)
  }

  private flattenExperiments() {
    return flatten<Experiment>([...this.experimentsByBranch.values()])
  }

  private collectColors() {
    this.colors = collectColors(
      this.getSelectedExperimentIds(),
      this.getAssignedColors(),
      this.colors.available
    )
    this.persistColors()
  }

  private persistSorts() {
    return this.workspaceState.update(
      MementoPrefixes.sortBy + this.dvcRoot,
      this.currentSorts
    )
  }

  private persistFilters() {
    return this.workspaceState.update(MementoPrefixes.filterBy + this.dvcRoot, [
      ...this.filters
    ])
  }

  private persistColors() {
    return this.workspaceState.update(MementoPrefixes.colors + this.dvcRoot, {
      assigned: [...this.colors.assigned],
      available: this.colors.available
    })
  }

  private persistStatus() {
    return this.workspaceState.update(
      MementoPrefixes.status + this.dvcRoot,
      this.status
    )
  }

  private revive(
    dvcRoot: string,
    workspaceState: Memento
  ): {
    colors: Colors
    currentSorts: SortDefinition[]
    filters: Map<string, FilterDefinition>
    status: Record<string, Status>
  } {
    const { assigned, available } = workspaceState.get<{
      assigned: [string, string][]
      available: string[]
    }>(MementoPrefixes.colors + dvcRoot, {
      assigned: [],
      available: copyOriginalColors()
    })

    return {
      colors: {
        assigned: new Map(assigned),
        available: available
      },
      currentSorts: workspaceState.get<SortDefinition[]>(
        MementoPrefixes.sortBy + dvcRoot,
        []
      ),
      filters: new Map(
        workspaceState.get<[string, FilterDefinition][]>(
          MementoPrefixes.filterBy + dvcRoot,
          []
        )
      ),
      status: workspaceState.get<Record<string, Status>>(
        MementoPrefixes.status + dvcRoot,
        {}
      )
    }
  }

  private getSelectedExperimentIds() {
    return this.flattenExperiments().reduce((acc, exp) => {
      const { id, queued } = exp
      if (!id) {
        return acc
      }

      if (!hasKey(this.status, id) && !queued) {
        this.status[id] = Status.selected
      }
      if (this.status[id]) {
        acc.push(id)
      }

      return acc
    }, [] as string[])
  }

  private addDisplayColor(experiment: Experiment, id?: string) {
    const assignedColors = this.getAssignedColors()
    const displayColor = assignedColors.get(id || experiment.id)

    return displayColor
      ? {
          ...experiment,
          displayColor
        }
      : experiment
  }

  private getAssignedColors() {
    return this.colors.assigned
  }
}
