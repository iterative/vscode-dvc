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
import { Experiment, RowData } from '../webview/contract'
import { definedAndNonEmpty, flatten } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { hasKey } from '../../util/object'
import { setContextValue } from '../../vscode/context'

export enum Status {
  SELECTED = 1,
  UNSELECTED = 0
}

export const enum MementoPrefixes {
  COLORS = 'colors:',
  FILTER_BY = 'filterBy:',
  SORT_BY = 'sortBy:',
  STATUS = 'status:'
}

export class ExperimentsModel {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()
  private colors: Colors
  private status: Record<string, Status>
  private displayName: Record<string, string> = {}

  private filters: Map<string, FilterDefinition> = new Map()
  private useFiltersForSelection = false

  private currentSorts: SortDefinition[]

  private readonly dvcRoot: string
  private readonly workspaceState: Memento

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

  public transformAndSet(data: ExperimentsOutput) {
    const { workspace, branches, experimentsByBranch, checkpointsByTip } =
      collectExperiments(data)

    this.workspace = workspace
    this.branches = branches
    this.experimentsByBranch = experimentsByBranch
    this.checkpointsByTip = checkpointsByTip

    Promise.all([this.setStatus(), this.setDisplayNames()])
    this.collectColors()
  }

  public toggleStatus(experimentId: string) {
    const status = this.status[experimentId]
      ? Status.UNSELECTED
      : Status.SELECTED
    this.status[experimentId] = status

    this.setSelectionMode(false)
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

  public getSelected() {
    const experimentColors = {} as Record<string, string>

    this.getAssignedColors().forEach((color: string, id: string) => {
      const { displayName, selected } = this.getExperimentDetails(id)
      if (displayName && selected) {
        experimentColors[displayName] = color
      }
    })

    return experimentColors
  }

  public setSelected(ids: string[]) {
    this.status = Object.keys(this.status).reduce((acc, id) => {
      const status = ids.includes(id) ? Status.SELECTED : Status.UNSELECTED
      acc[id] = status
      return acc
    }, {} as Record<string, Status>)
  }

  public setSelectionMode(useFilters: boolean) {
    setContextValue('dvc.experiments.filter.selected', useFilters)
    this.useFiltersForSelection = useFilters
  }

  public setSelectedToFilters() {
    const filtered = this.getSubRows(this.getSelectable()).map(exp => exp.id)
    this.setSelected(filtered)
  }

  public getExperiments(): (Experiment & {
    hasChildren: boolean
    selected?: boolean
  })[] {
    const workspace = this.workspace.running ? [this.workspace] : []
    return [...workspace, ...this.flattenExperiments()].map(experiment => ({
      ...this.addDetails(experiment),
      hasChildren: !!this.checkpointsByTip.get(experiment.id)
    }))
  }

  public getSelectable() {
    return this.getExperiments().filter(
      exp => exp.displayName !== 'workspace' && !exp.queued
    )
  }

  public getCheckpoints(experimentId: string): Experiment[] | undefined {
    return this.checkpointsByTip
      .get(experimentId)
      ?.map(checkpoint => this.addDetails(checkpoint, experimentId))
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

  private getExperimentDetails(id: string) {
    return { displayName: this.displayName[id], selected: !!this.status[id] }
  }

  private setStatus() {
    this.status = this.flattenExperiments().reduce((acc, exp) => {
      const { id, queued } = exp
      if (!queued) {
        acc[id] = hasKey(this.status, id) ? this.status[id] : Status.SELECTED
      }
      return acc
    }, {} as Record<string, Status>)

    this.persistStatus()
  }

  private setDisplayNames() {
    this.displayName = this.flattenExperiments().reduce((acc, exp) => {
      const { id, displayName } = exp
      acc[id] = displayName
      return acc
    }, {} as Record<string, string>)
  }

  private collectColors() {
    this.colors = collectColors(
      this.getExperimentIds(),
      this.getAssignedColors(),
      this.colors.available
    )
    this.persistColors()
  }

  private persistSorts() {
    return this.workspaceState.update(
      MementoPrefixes.SORT_BY + this.dvcRoot,
      this.currentSorts
    )
  }

  private applyAndPersistFilters() {
    if (this.useFiltersForSelection) {
      this.setSelectedToFilters()
    }
    return this.workspaceState.update(
      MementoPrefixes.FILTER_BY + this.dvcRoot,
      [...this.filters]
    )
  }

  private persistColors() {
    return this.workspaceState.update(MementoPrefixes.COLORS + this.dvcRoot, {
      assigned: [...this.colors.assigned],
      available: this.colors.available
    })
  }

  private persistStatus() {
    return this.workspaceState.update(
      MementoPrefixes.STATUS + this.dvcRoot,
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
    }>(MementoPrefixes.COLORS + dvcRoot, {
      assigned: [],
      available: copyOriginalColors()
    })

    return {
      colors: {
        assigned: new Map(assigned),
        available: available
      },
      currentSorts: workspaceState.get<SortDefinition[]>(
        MementoPrefixes.SORT_BY + dvcRoot,
        []
      ),
      filters: new Map(
        workspaceState.get<[string, FilterDefinition][]>(
          MementoPrefixes.FILTER_BY + dvcRoot,
          []
        )
      ),
      status: workspaceState.get<Record<string, Status>>(
        MementoPrefixes.STATUS + dvcRoot,
        {}
      )
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
    const assignedColors = this.getAssignedColors()
    const displayColor = assignedColors.get(id || experiment.id)
    const status = this.status[id || experiment.id]
    const selected = status !== undefined ? !!status : undefined

    return displayColor
      ? {
          ...experiment,
          displayColor,
          selected
        }
      : experiment
  }

  private getAssignedColors() {
    return this.colors.assigned
  }
}
