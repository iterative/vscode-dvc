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
import { collectLivePlotsData } from './livePlots/collect'
import { Experiment, RowData } from '../webview/contract'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'
import { PlotsData } from '../../plots/webview/contract'

const enum MementoPrefixes {
  sortBy = 'sortBy:',
  filterBy = 'filterBy:'
}

export class ExperimentsModel {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()
  private livePlots: PlotsData = []

  private filters: Map<string, FilterDefinition> = new Map()

  private currentSorts: SortDefinition[]

  private dvcRoot: string
  private workspaceState: Memento

  constructor(dvcRoot: string, workspaceState: Memento) {
    this.currentSorts = workspaceState.get(MementoPrefixes.sortBy + dvcRoot, [])
    this.filters = new Map(
      workspaceState.get(MementoPrefixes.filterBy + dvcRoot, [])
    )
    this.dvcRoot = dvcRoot
    this.workspaceState = workspaceState
  }

  public getLivePlots() {
    return this.livePlots
  }

  public async transformAndSet(data: ExperimentsRepoJSONOutput) {
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
      ...experiment,
      hasChildren: !!this.checkpointsByTip.get(experiment.id)
    }))
  }

  public getCheckpoints(experimentId: string): Experiment[] | undefined {
    return this.checkpointsByTip.get(experimentId)
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
          subRows: experiments
            .map(experiment => {
              const checkpoints = this.getFilteredCheckpointsByTip(
                experiment.id
              )
              if (!checkpoints) {
                return experiment
              }
              return { ...experiment, subRows: checkpoints }
            })
            .filter((row: RowData) => this.filterTableRow(row))
        }
      })
    ]
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
}
