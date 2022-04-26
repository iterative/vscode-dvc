import { Memento } from 'vscode'
import { SortDefinition, sortExperiments } from './sortBy'
import {
  FilterDefinition,
  filterExperiment,
  filterExperiments,
  getFilterId
} from './filterBy'
import { collectExperiments, collectColoredStatus } from './collect'
import { Color, copyOriginalColors } from './colors'
import {
  canSelect,
  limitToMaxSelected,
  ColoredStatus,
  tooManySelected,
  UNSELECTED
} from './status'
import { collectFlatExperimentParams } from './queue/collect'
import { Experiment, RowData } from '../webview/contract'
import { definedAndNonEmpty, reorderListSubset } from '../../util/array'
import { ExperimentsOutput } from '../../cli/reader'
import { setContextValue } from '../../vscode/context'
import { hasKey } from '../../util/object'
import { flattenMapValues } from '../../util/map'
import { ModelWithPersistence } from '../../persistence/model'
import { PersistenceKey } from '../../persistence/constants'

type SelectedExperimentWithColor = Experiment & {
  displayColor: Color
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
  private workspace = {} as Experiment
  private branches: Experiment[] = []
  private experimentsByBranch: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()
  private availableColors: Color[]
  private coloredStatus: ColoredStatus

  private filters: Map<string, FilterDefinition> = new Map()
  private useFiltersForSelection = false

  private currentSorts: SortDefinition[]

  constructor(dvcRoot: string, workspaceState: Memento) {
    super(dvcRoot, workspaceState)

    this.currentSorts = this.revive<SortDefinition[]>(
      PersistenceKey.EXPERIMENTS_SORT_BY,
      []
    )

    this.filters = new Map(
      this.revive<[string, FilterDefinition][]>(
        PersistenceKey.EXPERIMENTS_FILTER_BY,
        []
      )
    )
    this.coloredStatus = this.revive<ColoredStatus>(
      PersistenceKey.EXPERIMENTS_STATUS,
      {}
    )

    const assignedColors = new Set(
      Object.values(this.coloredStatus).filter(Boolean)
    )
    this.availableColors = copyOriginalColors().filter(
      color => !assignedColors.has(color)
    )
  }

  public transformAndSet(data: ExperimentsOutput, hasCheckpoints = false) {
    const { workspace, branches, experimentsByBranch, checkpointsByTip } =
      collectExperiments(data, hasCheckpoints)

    this.workspace = workspace
    this.branches = branches
    this.experimentsByBranch = experimentsByBranch
    this.checkpointsByTip = checkpointsByTip

    this.setColoredStatus()
  }

  public toggleStatus(id: string) {
    const current = this.coloredStatus[id]
    if (current) {
      this.unassignColor(current)
      this.coloredStatus[id] = UNSELECTED
    } else if (this.availableColors.length > 0) {
      this.coloredStatus[id] = this.availableColors.shift() as Color
    }

    this.setSelectionMode(false)
    this.persistStatus()
    return this.coloredStatus[id]
  }

  public canSelect() {
    return canSelect(this.coloredStatus)
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public setSelected(selectedExperiments: Experiment[]) {
    if (tooManySelected(selectedExperiments)) {
      selectedExperiments = limitToMaxSelected(selectedExperiments)
      this.setSelectionMode(false)
    }

    const selected = new Set(selectedExperiments.map(exp => exp.id))

    const acc: ColoredStatus = {}

    for (const { id } of this.getCombinedList()) {
      const current = this.coloredStatus[id]
      if (selected.has(id)) {
        continue
      }

      if (current) {
        this.unassignColor(current)
      }

      acc[id] = UNSELECTED
    }

    for (const { id } of selectedExperiments) {
      const current = this.coloredStatus[id]
      if (selected.has(id)) {
        acc[id] = current || (this.availableColors.shift() as Color)
      }
    }

    this.coloredStatus = acc

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
        ...this.addSelected(this.workspace),
        hasChildren: false,
        type: ExperimentType.WORKSPACE
      },
      ...this.branches.map(branch => {
        return {
          ...this.addSelected(branch),
          hasChildren: false,
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
      this.addSelected(this.workspace),
      ...this.branches.map(branch => {
        const experiments = this.getExperimentsByBranch(branch)
        const branchWithSelected = this.addSelected(branch)

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
    return !!this.coloredStatus[id]
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
    return !!filterExperiment(filters, row)
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

  private setColoredStatus() {
    if (this.useFiltersForSelection) {
      this.setSelectedToFilters()
      return
    }
    const { coloredStatus, availableColors } = collectColoredStatus(
      this.getExperiments(),
      this.checkpointsByTip,
      this.coloredStatus,
      this.availableColors
    )
    this.coloredStatus = coloredStatus
    this.setAvailableColors(availableColors)

    this.persistStatus()
  }

  private setAvailableColors(colors: Color[]) {
    this.availableColors = colors
  }

  private unassignColor(color: Color) {
    this.availableColors.unshift(color)
    this.availableColors = reorderListSubset(
      this.availableColors,
      copyOriginalColors()
    )
  }

  private setSelectedToFilters() {
    const filteredExperiments = this.getFilteredExperiments()
    this.setSelected(filteredExperiments)
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

  private persistStatus() {
    return this.persist(PersistenceKey.EXPERIMENTS_STATUS, this.coloredStatus)
  }

  private addSelected(experiment: Experiment) {
    const { id } = experiment
    if (!hasKey(this.coloredStatus, id)) {
      return experiment
    }

    const selected = this.isSelected(id)

    return {
      ...experiment,
      displayColor: this.coloredStatus[id]
        ? (this.coloredStatus[id] as Color)
        : undefined,
      selected
    }
  }

  private getSelectedFromList(getList: () => Experiment[]) {
    const acc: SelectedExperimentWithColor[] = []

    for (const experiment of getList()) {
      const displayColor = this.coloredStatus[experiment.id]
      if (displayColor) {
        acc.push({ ...experiment, displayColor } as SelectedExperimentWithColor)
      }
    }

    return acc
  }
}
