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
  collectStatuses
} from './collect'
import {
  copyOriginalBranchColors,
  copyOriginalExperimentColors
} from './colors'
import { collectColors, Colors } from './colors/collect'
import {
  canSelect,
  limitToMaxSelected,
  Status,
  Statuses,
  tooManySelected
} from './status'
import { collectFlatExperimentParams } from './queue/collect'
import { Experiment, RowData } from '../webview/contract'
import { definedAndNonEmpty } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { setContextValue } from '../../vscode/context'
import { hasKey } from '../../util/object'
import { flattenMapValues } from '../../util/map'
import { ModelWithPersistence } from '../../persistence/model'
import { PersistenceKey } from '../../persistence/constants'

type SelectedExperimentWithColor = Experiment & {
  displayColor: string
  selected: true
}

export type ExperimentWithCheckpoints = Experiment & {
  checkpoints?: Experiment[]
}

export enum ExperimentType {
  WORKSPACE = 'workspace',
  BRANCH = 'branch',
  EXPERIMENT = 'experiment',
  CHECKPOINT = 'checkpoint',
  QUEUED = 'queued'
}

export class ExperimentsModel extends ModelWithPersistence {
  public readonly dispose = Disposable.fn()

  private workspace = {} as Experiment
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()
  private branchColors: Colors
  private experimentColors: Colors
  private status: Statuses

  private filters: Map<string, FilterDefinition> = new Map()
  private useFiltersForSelection = false

  private currentSorts: SortDefinition[]

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(dvcRoot, workspaceState)

    this.branchColors = this.reviveColors(
      PersistenceKey.BRANCH_COLORS,
      copyOriginalBranchColors
    )
    this.currentSorts = this.revive<SortDefinition[]>(
      PersistenceKey.EXPERIMENTS_SORT_BY,
      []
    )
    this.experimentColors = this.reviveColors(
      PersistenceKey.EXPERIMENTS_COLORS,
      copyOriginalExperimentColors
    )
    this.filters = new Map(
      this.revive<[string, FilterDefinition][]>(
        PersistenceKey.EXPERIMENTS_FILTER_BY,
        []
      )
    )
    this.status = this.revive<Statuses>(PersistenceKey.EXPERIMENTS_STATUS, {})
  }

  public async transformAndSet(
    data: ExperimentsOutput,
    hasCheckpoints = false
  ) {
    await this.collectColors(data)

    const { workspace, branches, experimentsByBranch, checkpointsByTip } =
      collectExperiments(
        data,
        this.getAssignedBranchColors(),
        this.getAssignedExperimentColors(),
        hasCheckpoints
      )

    this.workspace = workspace
    this.branches = branches
    this.experimentsByBranch = experimentsByBranch
    this.checkpointsByTip = checkpointsByTip

    this.setStatus()
  }

  public toggleStatus(id: string) {
    const newStatus = this.isSelected(id) ? Status.UNSELECTED : Status.SELECTED
    this.status[id] = newStatus

    this.setSelectionMode(false)
    this.persistStatus()
    return newStatus
  }

  public canSelect() {
    return canSelect(this.status)
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

  public canAutoApplyFilters(...filterIdsToRemove: string[]): boolean {
    if (!this.useFiltersForSelection) {
      return true
    }

    const filters = new Map(this.filters)
    for (const id of filterIdsToRemove) {
      filters.delete(id)
    }
    const filteredExperiments = this.getFilteredExperiments([
      ...filters.values()
    ])
    return !tooManySelected(filteredExperiments)
  }

  public addFilter(filter: FilterDefinition) {
    this.filters.set(getFilterId(filter), filter)
    this.applyAndPersistFilters()
  }

  public removeFilters(filterIds: string[]) {
    filterIds.map(id => this.removeFilter(id))
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
    return this.getCombinedList().map(({ label }) => label)
  }

  public getMutableRevisions() {
    const acc: string[] = []

    for (const { label, mutable } of this.getCombinedList()) {
      if (mutable) {
        acc.push(label)
      }
    }
    return acc
  }

  public getSelectedRevisions() {
    return this.getSelectedFromList(() => this.getCombinedList())
  }

  public getSelectedExperiments() {
    return this.getSelectedFromList(() => this.flattenExperiments())
  }

  public setSelected(experiments: Experiment[]) {
    if (tooManySelected(experiments)) {
      experiments = limitToMaxSelected(experiments)
      this.setSelectionMode(false)
    }

    const selected = new Set(experiments.map(exp => exp.id))

    const acc: Statuses = {}

    for (const { id } of this.getCombinedList()) {
      const status = selected.has(id) ? Status.SELECTED : Status.UNSELECTED
      acc[id] = status
    }

    this.status = acc

    this.persistStatus()
  }

  public setSelectionMode(useFilters: boolean) {
    setContextValue('dvc.experiments.filter.selected', useFilters)
    this.useFiltersForSelection = useFilters
  }

  public getFilteredExperiments(filters = this.getFilters()) {
    const filteredExperiments = this.getSubRows(this.getExperiments(), filters)

    const filteredCheckpoints = filteredExperiments.flatMap(
      ({ id }) => this.getFilteredCheckpointsByTip(id, filters) || []
    )

    return [...filteredExperiments, ...filteredCheckpoints]
  }

  public getExperiments(): (Experiment & {
    hasChildren: boolean
    selected?: boolean
    type: ExperimentType
  })[] {
    return [
      {
        ...this.workspace,
        hasChildren: false,
        selected: !!this.status.workspace,
        type: ExperimentType.WORKSPACE
      },
      ...this.branches.map(branch => {
        return {
          ...branch,
          hasChildren: false,
          selected: this.isSelected(branch.id),
          type: ExperimentType.BRANCH
        }
      }),
      ...this.flattenExperiments().map(experiment => ({
        ...this.addSelected(experiment),
        hasChildren: definedAndNonEmpty(
          this.checkpointsByTip.get(experiment.id)
        ),
        type: experiment.queued
          ? ExperimentType.QUEUED
          : ExperimentType.EXPERIMENT
      }))
    ]
  }

  public getExperimentsWithCheckpoints(): ExperimentWithCheckpoints[] {
    return this.getExperiments().map(experiment => {
      const checkpoints = this.checkpointsByTip
        .get(experiment.id)
        ?.map(checkpoint => this.addSelected(checkpoint))
      if (!definedAndNonEmpty(checkpoints)) {
        return experiment
      }
      return { ...experiment, checkpoints }
    })
  }

  public getExperimentParams(id: string) {
    const params = this.getExperiments().find(
      experiment => experiment.id === id
    )?.params

    return collectFlatExperimentParams(params)
  }

  public getCurrentExperiments() {
    return this.splitExperimentsByQueued()
  }

  public getQueuedExperiments() {
    return this.splitExperimentsByQueued(true)
  }

  public getCheckpoints(
    id: string
  ): (Experiment & { type: ExperimentType })[] | undefined {
    return this.checkpointsByTip.get(id)?.map(checkpoint => ({
      ...this.addSelected(checkpoint),
      type: ExperimentType.CHECKPOINT
    }))
  }

  public getRowData() {
    return [
      { ...this.workspace, selected: this.isSelected('workspace') },
      ...this.branches.map(branch => {
        const experiments = this.getExperimentsByBranch(branch)
        const branchWithSelected = {
          ...branch,
          selected: this.isSelected(branch.id)
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

  public isSelected(id: string) {
    return !!this.status[id]
  }

  private getCombinedList() {
    return [
      this.workspace,
      ...this.branches,
      ...this.flattenExperiments(),
      ...this.flattenCheckpoints()
    ]
  }

  private getSubRows(experiments: Experiment[], filters = this.getFilters()) {
    return experiments
      .map(experiment => {
        const checkpoints = this.getFilteredCheckpointsByTip(
          experiment.id,
          filters
        )
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
      .filter((row: RowData) => this.filterTableRow(row, filters))
  }

  private findIndexByPath(pathToRemove: string) {
    return this.currentSorts.findIndex(({ path }) => path === pathToRemove)
  }

  private filterTableRow(row: RowData, filters: FilterDefinition[]): boolean {
    const hasUnfilteredCheckpoints = definedAndNonEmpty(row.subRows)
    if (hasUnfilteredCheckpoints) {
      return true
    }
    if (filterExperiment(filters, row)) {
      return true
    }
    return false
  }

  private getFilteredCheckpointsByTip(
    sha: string,
    filters: FilterDefinition[]
  ) {
    const checkpoints = this.checkpointsByTip.get(sha)
    if (!checkpoints) {
      return
    }
    return filterExperiments(filters, checkpoints)
  }

  private getExperimentsByBranch(branch: Experiment) {
    const experiments = this.experimentsByBranch.get(branch.label)
    if (!experiments) {
      return
    }
    return sortExperiments(this.getSorts(), experiments)
  }

  private flattenExperiments() {
    return flattenMapValues(this.experimentsByBranch)
  }

  private splitExperimentsByQueued(getQueued = false) {
    return this.flattenExperiments().filter(({ queued }) => {
      if (getQueued) {
        return queued
      }
      return !queued
    })
  }

  private flattenCheckpoints() {
    return flattenMapValues(this.checkpointsByTip)
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

  private setSelectedToFilters() {
    const filteredExperiments = this.getFilteredExperiments()
    this.setSelected(filteredExperiments)
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
        PersistenceKey.EXPERIMENTS_COLORS,
        this.experimentColors
      ),
      this.persistColors(PersistenceKey.BRANCH_COLORS, this.branchColors)
    ])
  }

  private persistSorts() {
    return this.persist(PersistenceKey.EXPERIMENTS_SORT_BY, this.currentSorts)
  }

  private applyAndPersistFilters() {
    if (this.useFiltersForSelection) {
      this.setSelectedToFilters()
    }
    return this.persist(PersistenceKey.EXPERIMENTS_FILTER_BY, [...this.filters])
  }

  private persistColors(prefix: PersistenceKey, colors: Colors) {
    this.persist(prefix, {
      assigned: [...colors.assigned],
      available: colors.available
    })
  }

  private persistStatus() {
    return this.persist(PersistenceKey.EXPERIMENTS_STATUS, this.status)
  }

  private reviveColors(
    key: PersistenceKey,
    copyOriginalColors: () => string[]
  ) {
    const { assigned, available } = this.revive<{
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

    const selected = this.isSelected(id)

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

  private getSelectedFromList(getList: () => Experiment[]) {
    const acc: SelectedExperimentWithColor[] = []

    for (const experiment of getList()) {
      if (this.isSelectedExperimentWithColor(experiment)) {
        acc.push(experiment)
      }
    }

    return acc
  }

  private isSelectedExperimentWithColor(
    experiment: Experiment
  ): experiment is SelectedExperimentWithColor {
    const { id, displayColor } = experiment
    return !!(displayColor && this.isSelected(id))
  }
}
