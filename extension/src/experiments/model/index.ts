import { Disposable } from '@hediet/std/disposable'
import { SortDefinition, sortExperiments } from './sortBy'
import {
  FilterDefinition,
  filterExperiment,
  filterExperiments,
  getFilterId
} from './filterBy'
import { collectExperiments } from './collect'
import { Experiment, RowData } from '../webview/contract'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'

export class ExperimentsModel {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()

  private filters: Map<string, FilterDefinition> = new Map()

  private currentSort?: SortDefinition

  public transformAndSet(data: ExperimentsRepoJSONOutput) {
    const { workspace, branches, experimentsByBranch, checkpointsByTip } =
      collectExperiments(data)

    this.workspace = workspace
    this.branches = branches
    this.experimentsByBranch = experimentsByBranch
    this.checkpointsByTip = checkpointsByTip
  }

  public setSort(sort: SortDefinition | undefined) {
    this.currentSort = sort
  }

  public getFilters() {
    return [...this.filters.values()]
  }

  public addFilter(filter: FilterDefinition) {
    this.filters.set(getFilterId(filter), filter)
  }

  public removeFilters(filters: FilterDefinition[]) {
    filters.map(filter => this.removeFilter(getFilterId(filter)))
  }

  public removeFilter(id: string) {
    return this.filters.delete(id)
  }

  public getExperiments(): (Experiment & { hasChildren: boolean })[] {
    const workspace = this.workspace.running ? [this.workspace] : []
    return [...workspace, ...this.flattenExperiments()].map(experiment => ({
      ...experiment,
      hasChildren: !!this.checkpointsByTip.get(experiment.id)
    }))
  }

  public getCheckpoints(name: string): Experiment[] | undefined {
    const id = this.getExperiments().find(
      experiment => experiment.displayName === name
    )?.id
    if (!id) {
      return
    }
    return this.checkpointsByTip.get(id)
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
    return sortExperiments(this.currentSort, experiments)
  }

  private flattenExperiments() {
    return flatten<Experiment>([...this.experimentsByBranch.values()])
  }
}
