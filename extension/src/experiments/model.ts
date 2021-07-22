import { Disposable } from '@hediet/std/disposable'
import { ColumnData, Experiment, TableData } from './webview/contract'
import { SortDefinition, sortRows } from './sorting'
import { FilterDefinition, filterExperiments, getFilterId } from './filtering'
import { transformExperimentsRepo } from './transformExperimentsRepo'
import { definedAndNonEmpty, flatten } from '../util/array'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

export enum ColumnStatus {
  selected = 2,
  indeterminate = 1,
  unselected = 0
}

export class ExperimentsModel {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private columnData: ColumnData[] = []
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()

  private filters: Map<string, FilterDefinition> = new Map()

  private columnStatus: Record<string, ColumnStatus> = {}

  private currentSort?: SortDefinition

  public transformAndSet(data: ExperimentsRepoJSONOutput) {
    const {
      columns,
      branches,
      experimentsByBranch,
      checkpointsByTip,
      workspace
    } = transformExperimentsRepo(data)

    columns.forEach(column => {
      if (this.columnStatus[column.path] === undefined) {
        this.columnStatus[column.path] = ColumnStatus.selected
      }
    })

    this.columnData = columns
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

  public getFilter(path: string) {
    return this.filters.get(path)
  }

  public addFilter(filter: FilterDefinition) {
    this.filters.set(getFilterId(filter), filter)
  }

  public removeFilters(filters: FilterDefinition[]) {
    filters.map(filter => this.filters.delete(getFilterId(filter)))
  }

  public getColumns() {
    return this.columnData
  }

  public getTerminalNodeColumns() {
    return this.columnData.filter(column => !column.hasChildren)
  }

  public getColumn(path: string) {
    const column = this.columnData?.find(column => column.path === path)
    if (column) {
      return {
        ...column,
        descendantMetadata: this.getDescendantMetaData(column),
        status: this.columnStatus[column.path]
      }
    }
  }

  public getChildColumns(path: string) {
    return this.columnData?.filter(column =>
      path
        ? column.parentPath === path
        : ['metrics', 'params'].includes(column.parentPath)
    )
  }

  public toggleColumnStatus(path: string) {
    const status = this.getNextStatus(path)
    this.columnStatus[path] = status
    this.setAreParentsSelected(path)
    this.setAreChildrenSelected(path, status)

    return this.columnStatus[path]
  }

  public getRunningOrQueued(): string[] {
    return [this.workspace, ...this.getExperiments()]
      .filter(experiment => experiment?.queued || experiment?.running)
      .map(experiment => experiment.displayName)
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
      columns:
        this.columnData?.filter(
          column => this.columnStatus[column.path] !== ColumnStatus.unselected
        ) || [],
      rows: this.getRowData()
    }
  }

  private getRowData() {
    return [
      ...this.getWorkspace(),
      ...this.getBranches().map(branch => {
        const experiments = this.getExperimentsByBranch(branch)

        if (!definedAndNonEmpty(experiments)) {
          return branch
        }
        return {
          ...branch,
          subRows: experiments.map(experiment => {
            const checkpoints = this.getCheckpointsByTip(experiment.id)
            if (!definedAndNonEmpty(checkpoints)) {
              return experiment
            }
            return { ...experiment, subRows: checkpoints }
          })
        }
      })
    ]
  }

  private getWorkspace() {
    return this.filter([this.workspace])
  }

  private getBranches() {
    return this.filter(this.branches)
  }

  private getCheckpointsByTip(id: string) {
    const checkpoints = this.checkpointsByTip.get(id)
    if (!checkpoints) {
      return
    }
    return this.filter(checkpoints)
  }

  private getExperimentsByBranch(branch: Experiment) {
    const experiments = this.experimentsByBranch.get(branch.displayName)
    if (!experiments) {
      return
    }
    return this.sort(this.filter(experiments))
  }

  private getExperiments() {
    const flatExperiments = flatten<Experiment>([
      ...this.experimentsByBranch.values()
    ])
    return this.sort(flatExperiments)
  }

  private sort(experiments: Experiment[]) {
    return sortRows(this.currentSort, experiments)
  }

  private filter(experiments: Experiment[]) {
    return filterExperiments(this.getFilters(), experiments)
  }

  private setAreChildrenSelected(path: string, status: ColumnStatus) {
    return this.getChildColumns(path)?.map(column => {
      const path = column.path
      this.columnStatus[path] = status
      this.setAreChildrenSelected(path, status)
    })
  }

  private setAreParentsSelected(path: string) {
    const changedColumn = this.getColumn(path)
    if (!changedColumn) {
      return
    }
    const parent = this.getColumn(changedColumn.parentPath)
    if (!parent) {
      return
    }

    const parentPath = parent.path

    const status = this.getStatus(parentPath)
    this.columnStatus[parentPath] = status
    this.setAreParentsSelected(parentPath)
  }

  private getStatus(parentPath: string) {
    const statuses = this.getDescendantsStatuses(parentPath)

    const isAnyChildSelected = statuses.includes(ColumnStatus.selected)
    const isAnyChildUnselected = statuses.includes(ColumnStatus.unselected)

    if (isAnyChildSelected && isAnyChildUnselected) {
      return ColumnStatus.indeterminate
    }

    if (!isAnyChildUnselected) {
      return ColumnStatus.selected
    }

    return ColumnStatus.unselected
  }

  private getDescendantsStatuses(parentPath: string): ColumnStatus[] {
    const nestedStatuses = (this.getChildColumns(parentPath) || []).map(
      column => {
        const descendantsStatuses = column.hasChildren
          ? this.getDescendantsStatuses(column.path)
          : []
        return [this.columnStatus[column.path], ...descendantsStatuses]
      }
    )

    return flatten<ColumnStatus>(nestedStatuses)
  }

  private getNextStatus(path: string) {
    const status = this.columnStatus[path]
    if (status === ColumnStatus.selected) {
      return ColumnStatus.unselected
    }
    return ColumnStatus.selected
  }

  private getDescendantMetaData(column: ColumnData) {
    if (!column.hasChildren) {
      return
    }
    const statuses = this.getDescendantsStatuses(column.path)
    return `${
      statuses.filter(status =>
        [ColumnStatus.selected, ColumnStatus.indeterminate].includes(status)
      ).length
    }/${statuses.length}`
  }
}
