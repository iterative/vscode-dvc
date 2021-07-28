import { Disposable } from '@hediet/std/disposable'
import { SortDefinition, sortRows } from './sorting'
import {
  FilterDefinition,
  filterExperiment,
  filterExperiments,
  getFilterId
} from './filtering'
import { collectParamsAndMetrics } from './collectParamsAndMetrics'
import { collectExperiments } from './collectExperiments'
import { ParamsAndMetrics } from './paramsAndMetrics'
import { Experiment, RowData, TableData } from '../webview/contract'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { ExperimentsRepoJSONOutput } from '../../cli/reader'

export enum ExperimentStatus {
  RUNNING = 1,
  QUEUED = 2
}

export class ExperimentsModel {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private paramsAndMetrics = new ParamsAndMetrics()
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()

  private filters: Map<string, FilterDefinition> = new Map()

  private currentSort?: SortDefinition

  public transformAndSet(data: ExperimentsRepoJSONOutput) {
    const { workspace, branches, experimentsByBranch, checkpointsByTip } =
      collectExperiments(data)

    const paramsAndMetrics = collectParamsAndMetrics(data)

    this.paramsAndMetrics.update(paramsAndMetrics)

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

  public getParamsAndMetrics() {
    return this.paramsAndMetrics.getParamsAndMetrics()
  }

  public getTerminalParamsAndMetrics() {
    return this.paramsAndMetrics.getTerminalNodes()
  }

  public getParamOrMetric(path: string) {
    return this.paramsAndMetrics.getParamOrMetric(path)
  }

  public getParamsAndMetricsStatuses() {
    return this.paramsAndMetrics.getTerminalNodeStatuses()
  }

  public getChildParamsOrMetrics(path: string) {
    return this.paramsAndMetrics.getChildren(path)
  }

  public toggleParamOrMetricStatus(path: string) {
    return this.paramsAndMetrics.toggleStatus(path)
  }

  public getExperimentStatuses(): number[] {
    return [this.workspace, ...this.getExperiments()]
      .filter(experiment => experiment.running || experiment.queued)
      .map(experiment =>
        experiment.running ? ExperimentStatus.RUNNING : ExperimentStatus.QUEUED
      )
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

  public getTableData(): TableData {
    return {
      columns: this.paramsAndMetrics.getSelected(),
      rows: this.getRowData()
    }
  }

  private getRowData() {
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
    return sortRows(this.currentSort, experiments)
  }

  private getExperiments() {
    return flatten<Experiment>([...this.experimentsByBranch.values()])
  }
}
