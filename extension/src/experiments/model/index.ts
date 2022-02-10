import { Memento } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { SortDefinition, sortExperiments } from './sortBy'
import {
  FilterDefinition,
  filterExperiment,
  filterExperiments,
  getFilterId
} from './filterBy'
import { collectExperiments, collectStatuses, Status } from './collect'
import {
  copyOriginalBranchColors,
  copyOriginalExperimentColors,
  getWorkspaceColor
} from './colors'
import { collectColors, Colors } from './colors/collect'
import { collectFlatExperimentParams } from './queue/collect'
import { Experiment, RowData } from '../webview/contract'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { setContextValue } from '../../vscode/context'
import { MementoPrefix } from '../../vscode/memento'

export class ExperimentsModel {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()
  private branchColors: Colors
  private experimentColors: Colors
  private status: Record<string, Status>
  private revisions: Record<string, string> = {}

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

  public transformAndSet(data: ExperimentsOutput) {
    const { workspace, branches, experimentsByBranch, checkpointsByTip } =
      collectExperiments(data)

    this.workspace = { ...workspace, displayColor: getWorkspaceColor() }
    this.branches = branches
    this.experimentsByBranch = experimentsByBranch
    this.checkpointsByTip = checkpointsByTip

    this.setExperimentRevisions()
    this.setStatus()
    return this.collectColors()
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

  public getSelectedRevisions() {
    const revisionColors = {} as Record<string, string>
    if (this.status.workspace) {
      revisionColors.workspace = getWorkspaceColor()
    }

    this.getAssignedBranchColors().forEach((color: string, id: string) => {
      if (this.getStatus(id)) {
        revisionColors[id] = color
      }
    })

    this.getAssignedExperimentColors().forEach((color: string, id: string) => {
      const { selected, revision } = this.getExperimentDetails(id)
      if (selected) {
        revisionColors[revision] = color
      }
    })

    return revisionColors
  }

  public getSelectedExperiments() {
    const experimentColors = {} as Record<string, string>

    this.getAssignedExperimentColors().forEach((color: string, id: string) => {
      if (this.getStatus(id)) {
        experimentColors[id] = color
      }
    })

    return experimentColors
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
          displayColor: this.getBranchColor(branch.id),
          hasChildren: false,
          selected: !!this.getStatus(branch.id)
        }
      }),
      ...this.flattenExperiments().map(experiment => ({
        ...this.addDetails(experiment),
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
      ?.map(checkpoint => this.addDetails(checkpoint, id))
  }

  public getRowData() {
    return [
      { ...this.workspace, selected: this.getStatus('workspace') },
      ...this.branches.map(branch => {
        const experiments = this.getExperimentsByBranch(branch)
        const branchWithColor = {
          ...branch,
          displayColor: this.getBranchColor(branch.id),
          selected: this.getStatus(branch.id)
        }

        if (!definedAndNonEmpty(experiments)) {
          return branchWithColor
        }

        return {
          ...branchWithColor,
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
          return this.addDetails(experiment)
        }
        return {
          ...this.addDetails(experiment),
          subRows: checkpoints.map(checkpoint => ({
            ...this.addDetails(checkpoint, experiment.id)
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
    const experiments = this.experimentsByBranch.get(branch.displayId)
    if (!experiments) {
      return
    }
    return sortExperiments(this.getSorts(), experiments)
  }

  private flattenExperiments() {
    return flatten<Experiment>([...this.experimentsByBranch.values()])
  }

  private getExperimentDetails(id: string) {
    const revision = this.revisions[id]
    return { revision, selected: this.getStatus(id) }
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

  private setExperimentRevisions() {
    this.revisions = this.flattenExperiments().reduce((acc, exp) => {
      const { id, displayId } = exp
      if (displayId) {
        acc[id] = displayId
      }
      return acc
    }, {} as Record<string, string>)
  }

  private async collectColors() {
    const [branchColors, experimentColors] = await Promise.all([
      collectColors(
        this.branches.map(branch => branch.id).filter(Boolean) as string[],
        this.getAssignedBranchColors(),
        this.branchColors.available,
        copyOriginalBranchColors
      ),
      collectColors(
        this.getExperimentIds(),
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

  private getExperimentIds() {
    return this.flattenExperiments().reduce((acc, { id, queued }) => {
      if (!queued) {
        acc.push(id)
      }

      return acc
    }, [] as string[])
  }

  private addDetails(experiment: Experiment, id?: string) {
    const assignedColors = this.getAssignedExperimentColors()
    const displayColor = assignedColors.get(id || experiment.id)
    const selected = !!this.getStatus(experiment.id)

    return displayColor
      ? {
          ...experiment,
          displayColor,
          selected
        }
      : experiment
  }

  private getAssignedBranchColors() {
    return this.branchColors.assigned
  }

  private getBranchColor(id: string) {
    return this.getAssignedBranchColors().get(id)
  }

  private getAssignedExperimentColors() {
    return this.experimentColors.assigned
  }

  private getStatus(id: string) {
    return !!this.status[id]
  }
}
