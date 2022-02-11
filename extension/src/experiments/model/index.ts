import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { SortDefinition, sortExperiments } from './sortBy'
import {
  FilterDefinition,
  filterExperiment,
  filterExperiments,
  getFilterId
} from './filterBy'
import {
  collectBranchAndExperimentIds,
  collectExperiments,
  collectStatuses,
  Status
} from './collect'
import {
  copyOriginalBranchColors,
  copyOriginalExperimentColors
} from './colors'
import { collectColors, Colors } from './colors/collect'
import { collectFlatExperimentParams } from './queue/collect'
import { Experiment, RowData } from '../webview/contract'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { setContextValue } from '../../vscode/context'
import { MementoPrefix } from '../../vscode/memento'
import { hasKey } from '../../util/object'

export class ExperimentsModel {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()
  private branchColors: Colors
  private experimentColors: Colors
  private status: Record<string, Status>

  private filters: Map<string, FilterDefinition> = new Map()
  private useFiltersForSelection = false

  private currentSorts: SortDefinition[]

  private readonly dvcRoot: string
  private readonly workspaceState: Memento

  constructor(dvcRoot: string, workspaceState: Memento) {
    const { branchColors, currentSorts, experimentColors, filters, status } =
      this.revive(dvcRoot, workspaceState)
    this.branchColors = branchColors
    this.currentSorts = currentSorts
    this.experimentColors = experimentColors
    this.status = status
    this.filters = filters

    this.dvcRoot = dvcRoot

    this.workspaceState = workspaceState
  }

  public async transformAndSet(data: ExperimentsOutput) {
    await this.collectColors(data)

    const { workspace, branches, experimentsByBranch, checkpointsByTip } =
      collectExperiments(
        data,
        this.getAssignedBranchColors(),
        this.getAssignedExperimentColors()
      )

    this.workspace = workspace
    this.branches = branches
    this.experimentsByBranch = experimentsByBranch
    this.checkpointsByTip = checkpointsByTip

    this.setStatus()
  }

  public toggleStatus(id: string) {
    const newStatus = this.getStatus(id) ? Status.UNSELECTED : Status.SELECTED
    this.status[id] = newStatus

    this.setSelectionMode(false)
    this.persistStatus()
    return newStatus
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
    this.applyAndPersistFilters()
  }

  public removeFilters(filters: FilterDefinition[]) {
    filters.map(filter => this.removeFilter(getFilterId(filter)))
  }

  public removeFilter(id: string) {
    const result = this.filters.delete(id)
    this.applyAndPersistFilters()
    return result
  }

  public getBranchRevisions() {
    return this.branches.map(({ id, sha }) => ({ id, sha }))
  }

  public getRevisions() {
    return [
      this.workspace,
      ...this.branches,
      ...this.flattenExperiments(),
      ...this.flattenCheckpoints()
    ].map(({ label }) => label)
  }

  public getSelectedRevisions() {
    return [
      this.workspace,
      ...this.branches,
      ...this.flattenExperiments(),
      ...this.flattenCheckpoints()
    ].reduce((acc, { id, label, displayColor }) => {
      if (displayColor && this.getStatus(id)) {
        acc[label] = displayColor
      }
      return acc
    }, {} as Record<string, string>)
  }

  public getSelectedExperiments() {
    return this.flattenExperiments().reduce((acc, { id, displayColor }) => {
      if (displayColor && this.getStatus(id)) {
        acc[id] = displayColor
      }
      return acc
    }, {} as Record<string, string>)
  }

  public setSelected(experiments: Experiment[]) {
    const selected = experiments.map(exp => exp.id)

    this.status = this.getExperiments().reduce((acc, { id }) => {
      const status = selected.includes(id) ? Status.SELECTED : Status.UNSELECTED
      acc[id] = status

      return acc
    }, {} as Record<string, Status>)

    this.persistStatus()
  }

  public setSelectionMode(useFilters: boolean) {
    setContextValue('dvc.experiments.filter.selected', useFilters)
    this.useFiltersForSelection = useFilters
  }

  public setSelectedToFilters() {
    const filtered = this.getSubRows(this.getExperiments())
    this.setSelected(filtered)
  }

  public getExperiments(): (Experiment & {
    hasChildren: boolean
    selected?: boolean
  })[] {
    return [
      {
        ...this.workspace,
        hasChildren: false,
        selected: !!this.status.workspace
      },
      ...this.branches.map(branch => {
        return {
          ...branch,
          hasChildren: false,
          selected: !!this.getStatus(branch.id)
        }
      }),
      ...this.flattenExperiments().map(experiment => ({
        ...this.addSelected(experiment),
        hasChildren: !!this.checkpointsByTip.get(experiment.id)
      }))
    ]
  }

  public getExperimentParams(id: string) {
    const params =
      id === 'workspace'
        ? this.workspace.params
        : this.flattenExperiments().find(experiment => experiment.id === id)
            ?.params

    return collectFlatExperimentParams(params)
  }

  public getCurrentExperiments() {
    return this.flattenExperiments().filter(({ queued }) => !queued)
  }

  public getCheckpoints(id: string): Experiment[] | undefined {
    return this.checkpointsByTip
      .get(id)
      ?.map(checkpoint => this.addSelected(checkpoint))
  }

  public getRowData() {
    return [
      { ...this.workspace, selected: this.getStatus('workspace') },
      ...this.branches.map(branch => {
        const experiments = this.getExperimentsByBranch(branch)
        const branchWithSelected = {
          ...branch,
          selected: this.getStatus(branch.id)
        }

        if (!definedAndNonEmpty(experiments)) {
          return branchWithSelected
        }

        return {
          ...branchWithSelected,
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
          return this.addSelected(experiment)
        }
        return {
          ...this.addSelected(experiment),
          subRows: checkpoints.map(checkpoint => ({
            ...this.addSelected(checkpoint)
          }))
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

  private getFilteredCheckpointsByTip(sha: string) {
    const checkpoints = this.checkpointsByTip.get(sha)
    if (!checkpoints) {
      return
    }
    return filterExperiments(this.getFilters(), checkpoints)
  }

  private getExperimentsByBranch(branch: Experiment) {
    const experiments = this.experimentsByBranch.get(branch.label)
    if (!experiments) {
      return
    }
    return sortExperiments(this.getSorts(), experiments)
  }

  private flattenExperiments() {
    return flatten<Experiment>([...this.experimentsByBranch.values()])
  }

  private flattenCheckpoints() {
    return flatten<Experiment>([...this.checkpointsByTip.values()])
  }

  private setStatus() {
    if (this.useFiltersForSelection) {
      this.setSelectedToFilters()
      return
    }
    this.status = collectStatuses(
      this.getExperiments(),
      this.checkpointsByTip,
      this.status
    )

    this.persistStatus()
  }

  private async collectColors(data: ExperimentsOutput) {
    const { branchIds, experimentIds } = collectBranchAndExperimentIds(data)
    const [branchColors, experimentColors] = await Promise.all([
      collectColors(
        branchIds,
        this.getAssignedBranchColors(),
        this.branchColors.available,
        copyOriginalBranchColors
      ),
      collectColors(
        experimentIds,
        this.getAssignedExperimentColors(),
        this.experimentColors.available,
        copyOriginalExperimentColors
      )
    ])

    this.branchColors = branchColors
    this.experimentColors = experimentColors

    Promise.all([
      this.persistColors(
        MementoPrefix.EXPERIMENTS_COLORS,
        this.experimentColors
      ),
      this.persistColors(MementoPrefix.BRANCH_COLORS, this.branchColors)
    ])
  }

  private persistSorts() {
    return this.workspaceState.update(
      MementoPrefix.EXPERIMENTS_SORT_BY + this.dvcRoot,
      this.currentSorts
    )
  }

  private applyAndPersistFilters() {
    if (this.useFiltersForSelection) {
      this.setSelectedToFilters()
    }
    return this.workspaceState.update(
      MementoPrefix.EXPERIMENTS_FILTER_BY + this.dvcRoot,
      [...this.filters]
    )
  }

  private persistColors(prefix: MementoPrefix, colors: Colors) {
    this.workspaceState.update(prefix + this.dvcRoot, {
      assigned: [...colors.assigned],
      available: colors.available
    })
  }

  private persistStatus() {
    return this.workspaceState.update(
      MementoPrefix.EXPERIMENTS_STATUS + this.dvcRoot,
      this.status
    )
  }

  private revive(
    dvcRoot: string,
    workspaceState: Memento
  ): {
    branchColors: Colors
    experimentColors: Colors
    currentSorts: SortDefinition[]
    filters: Map<string, FilterDefinition>
    status: Record<string, Status>
  } {
    return {
      branchColors: this.reviveColors(
        workspaceState,
        MementoPrefix.BRANCH_COLORS + dvcRoot,
        copyOriginalBranchColors
      ),
      currentSorts: workspaceState.get<SortDefinition[]>(
        MementoPrefix.EXPERIMENTS_SORT_BY + dvcRoot,
        []
      ),
      experimentColors: this.reviveColors(
        workspaceState,
        MementoPrefix.EXPERIMENTS_COLORS + dvcRoot,
        copyOriginalExperimentColors
      ),
      filters: new Map(
        workspaceState.get<[string, FilterDefinition][]>(
          MementoPrefix.EXPERIMENTS_FILTER_BY + dvcRoot,
          []
        )
      ),
      status: workspaceState.get<Record<string, Status>>(
        MementoPrefix.EXPERIMENTS_STATUS + dvcRoot,
        {}
      )
    }
  }

  private reviveColors(
    workspaceState: Memento,
    key: string,
    copyOriginalColors: () => string[]
  ) {
    const { assigned, available } = workspaceState.get<{
      assigned: [string, string][]
      available: string[]
    }>(key, {
      assigned: [],
      available: copyOriginalColors()
    })

    return {
      assigned: new Map(assigned),
      available: available
    }
  }

  private addSelected(experiment: Experiment) {
    const { id } = experiment
    if (!hasKey(this.status, id)) {
      return experiment
    }

    const selected = !!this.getStatus(id)

    return {
      ...experiment,
      selected
    }
  }

  private getAssignedBranchColors() {
    return this.branchColors.assigned
  }

  private getAssignedExperimentColors() {
    return this.experimentColors.assigned
  }

  private getStatus(id: string) {
    return !!this.status[id]
  }
}
