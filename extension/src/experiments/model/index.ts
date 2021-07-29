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

export enum Status {
  RUNNING = 1,
  QUEUED = 2
}

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

  public getSorts(): SortDefinition[] {
    return this.currentSort ? [this.currentSort] : []
  }

  public getFilters() {
    return [...this.filters.values()]
  }

  public getFilter(id: string) {
    return this.filters.get(id)
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

  public getExperimentStatuses(): number[] {
    return [this.workspace, ...this.getExperiments()]
      .filter(experiment => experiment.running || experiment.queued)
      .map(experiment => (experiment.running ? Status.RUNNING : Status.QUEUED))
  }

  public getExperimentNames(): string[] {
    const workspace = this.workspace.running ? [this.workspace] : []
    return [...workspace, ...this.getExperiments()].map(
      experiment => experiment?.displayName
    )
  }

  public getExperiment(name: string) {
    const experiment = this.getExperiments().find(
      experiment => experiment.displayName === name
    )

    if (!experiment) {
      return
    }

    return {
      ...experiment,
      hasChildren: !!this.checkpointsByTip.get(experiment.id)
    }
  }

  public getCheckpointNames(name: string) {
    const id = this.getExperiment(name)?.id
    if (!id) {
      return
    }
    return this.checkpointsByTip
      .get(id)
      ?.map(checkpoint => checkpoint.displayName)
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
    return sortExperiments(this.getSorts(), experiments)
  }

  private getExperiments() {
    return flatten<Experiment>([...this.experimentsByBranch.values()])
  }
}
