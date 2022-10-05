import { Memento } from 'vscode'
import { SortDefinition, sortExperiments } from './sortBy'
import {
  FilterDefinition,
  filterExperiment,
  splitExperimentsByFilters,
  getFilterId
} from './filterBy'
import { collectExperiments, collectMutableRevisions } from './collect'
import {
  collectFiltered,
  collectFilteredCounts,
  ExperimentAugmented,
  ExperimentWithType
} from './filterBy/collect'
import { collectColoredStatus, collectSelected } from './status/collect'
import { Color, copyOriginalColors } from './status/colors'
import {
  canSelect,
  limitToMaxSelected,
  ColoredStatus,
  tooManySelected,
  UNSELECTED
} from './status'
import { collectFlatExperimentParams } from './modify/collect'
import { Experiment, Row } from '../webview/contract'
import {
  definedAndNonEmpty,
  reorderListSubset,
  reorderObjectList
} from '../../util/array'
import { ExperimentsOutput } from '../../cli/dvc/contract'
import { setContextValue } from '../../vscode/context'
import { hasKey } from '../../util/object'
import { flattenMapValues } from '../../util/map'
import { ModelWithPersistence } from '../../persistence/model'
import { PersistenceKey } from '../../persistence/constants'
import { sum } from '../../util/math'

export type StarredExperiments = Record<string, boolean | undefined>

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
  private starredExperiments: StarredExperiments

  private filters: Map<string, FilterDefinition> = new Map()
  private useFiltersForSelection = false

  private currentSorts: SortDefinition[]
  private hasRunning = false

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
    this.starredExperiments = this.revive<StarredExperiments>(
      PersistenceKey.EXPERIMENTS_STARS,
      {}
    )

    const assignedColors = new Set(
      Object.values(this.coloredStatus).filter(Boolean)
    )
    this.availableColors = copyOriginalColors().filter(
      color => !assignedColors.has(color)
    )
  }

  public transformAndSet(data: ExperimentsOutput) {
    const {
      workspace,
      branches,
      experimentsByBranch,
      checkpointsByTip,
      hasRunning
    } = collectExperiments(data)

    this.workspace = workspace
    this.branches = branches
    this.experimentsByBranch = experimentsByBranch
    this.checkpointsByTip = checkpointsByTip
    this.hasRunning = hasRunning

    this.setColoredStatus()
  }

  public toggleStars(ids: string[]) {
    for (const id of ids) {
      this.starredExperiments[id] = !this.starredExperiments[id]
      this.persistStars()
    }
  }

  public toggleStatus(id: string) {
    if (
      this.getFlattenedExperiments().find(({ id: queuedId }) => queuedId === id)
        ?.queued
    ) {
      return
    }

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

  public hasRunningExperiment() {
    return this.hasRunning
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

  public getFilterPaths() {
    return this.getFilters().map(({ path }) => path)
  }

  public canAutoApplyFilters(...filterIdsToRemove: string[]): boolean {
    if (!this.useFiltersForSelection) {
      return true
    }

    const filters = new Map(this.filters)
    for (const id of filterIdsToRemove) {
      filters.delete(id)
    }
    const filteredExperiments = this.getUnfilteredExperiments([
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

  public getMutableRevisions(hasCheckpoints: boolean) {
    return collectMutableRevisions(this.getAllExperiments(), hasCheckpoints)
  }

  public getSelectedRevisions() {
    return this.getSelectedFromList(() => this.getCombinedList())
  }

  public getSelectedExperiments() {
    return this.getSelectedFromList(() => this.getFlattenedExperiments())
  }

  public setSelected(selectedExperiments: Experiment[]) {
    if (tooManySelected(selectedExperiments)) {
      selectedExperiments = limitToMaxSelected(selectedExperiments)
      this.setSelectionMode(false)
    }

    const { availableColors, coloredStatus } = collectSelected(
      selectedExperiments,
      this.getCombinedList(),
      this.coloredStatus,
      this.availableColors
    )

    this.setColors(coloredStatus, availableColors)

    this.persistStatus()
  }

  public setSelectionMode(useFilters: boolean) {
    setContextValue('dvc.experiments.filter.selected', useFilters)
    this.useFiltersForSelection = useFilters
  }

  public getUnfilteredExperiments(filters = this.getFilters()) {
    const unfilteredExperiments = this.getSubRows(
      this.getAllExperiments(),
      filters
    )

    const unfilteredCheckpoints = unfilteredExperiments.flatMap(
      ({ id }) => this.getUnfilteredCheckpointsByTip(id, filters) || []
    )

    return [...unfilteredExperiments, ...unfilteredCheckpoints]
  }

  public getLabels() {
    return this.getCombinedList().map(({ label }) => label)
  }

  public getLabelsToDecorate() {
    return new Set<string>(
      this.getFilteredExperiments().map(({ label }) => label)
    )
  }

  public getExperiments(): ExperimentAugmented[] {
    return [
      {
        ...this.addDetails(this.workspace),
        hasChildren: false,
        type: ExperimentType.WORKSPACE
      },
      ...this.branches.map(branch => {
        return {
          ...this.addDetails(branch),
          hasChildren: !!this.experimentsByBranch.get(branch.label),
          type: ExperimentType.BRANCH
        }
      })
    ]
  }

  public getAllExperiments() {
    return [...this.getExperiments(), ...this.getFlattenedExperiments()]
  }

  public getErrors() {
    return new Set(
      this.getCombinedList()
        .filter(({ error }) => error)
        .map(({ label }) => label)
    )
  }

  public getExperimentsWithCheckpoints(): ExperimentWithCheckpoints[] {
    const experimentsWithCheckpoints: ExperimentWithCheckpoints[] = []
    for (const experiment of this.getAllExperiments()) {
      const { id, queued } = experiment
      if (queued) {
        continue
      }

      const checkpoints = this.getCheckpointsWithType(id)
      if (!definedAndNonEmpty(checkpoints)) {
        experimentsWithCheckpoints.push(experiment)
        continue
      }
      experimentsWithCheckpoints.push({ ...experiment, checkpoints })
    }
    return experimentsWithCheckpoints
  }

  public getExperimentParams(id: string) {
    const params = this.getAllExperiments().find(
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

  public getCheckpointsWithType(
    id: string
  ): (Experiment & { type: ExperimentType })[] | undefined {
    return this.checkpointsByTip.get(id)?.map(checkpoint => ({
      ...this.addDetails(checkpoint),
      type: ExperimentType.CHECKPOINT
    }))
  }

  public getRowData() {
    return [
      this.addDetails(this.workspace),
      ...this.branches.map(branch => {
        const experiments = this.getExperimentsByBranch(branch)
        const branchWithSelectedAndStarred = this.addDetails(branch)

        if (!definedAndNonEmpty(experiments)) {
          return branchWithSelectedAndStarred
        }

        return {
          ...branchWithSelectedAndStarred,
          subRows: this.getSubRows(experiments)
        }
      })
    ]
  }

  public isSelected(id: string) {
    return !!this.coloredStatus[id]
  }

  public isStarred(id: string) {
    return !!this.starredExperiments[id]
  }

  public getExperimentCount() {
    return sum([
      this.getFlattenedCheckpoints().length,
      this.getFlattenedExperiments().length,
      this.branches.length,
      1
    ])
  }

  public getFilteredCounts(hasCheckpoints: boolean) {
    const filtered = this.getFilteredExperiments()
    return collectFilteredCounts(filtered, hasCheckpoints)
  }

  public getCombinedList() {
    return [
      this.workspace,
      ...this.branches,
      ...this.getFlattenedExperiments(),
      ...this.getFlattenedCheckpoints()
    ]
  }

  public getExperimentsByBranchForTree(branch: Experiment) {
    return this.getExperimentsByBranch(branch)?.map(experiment => ({
      ...experiment,
      hasChildren: definedAndNonEmpty(this.checkpointsByTip.get(experiment.id)),
      type: experiment.queued
        ? ExperimentType.QUEUED
        : ExperimentType.EXPERIMENT
    }))
  }

  private getSubRows(experiments: Experiment[], filters = this.getFilters()) {
    return experiments
      .map(experiment => {
        const checkpoints = this.getUnfilteredCheckpointsByTip(
          experiment.id,
          filters
        )
        if (!checkpoints) {
          return experiment
        }
        return {
          ...experiment,
          subRows: checkpoints
        }
      })
      .filter((row: Row) => this.filterTableRow(row, filters))
  }

  private findIndexByPath(pathToRemove: string) {
    return this.currentSorts.findIndex(({ path }) => path === pathToRemove)
  }

  private filterTableRow(row: Row, filters: FilterDefinition[]): boolean {
    const hasUnfilteredCheckpoints = definedAndNonEmpty(row.subRows)
    if (hasUnfilteredCheckpoints) {
      return true
    }
    return !!filterExperiment(filters, row)
  }

  private getFilteredExperiments() {
    const acc: ExperimentWithType[] = []

    for (const experiment of this.getCurrentExperiments()) {
      const checkpoints = this.getCheckpointsWithType(experiment.id) || []
      collectFiltered(acc, this.getFilters(), experiment, checkpoints)
    }

    return acc
  }

  private getUnfilteredCheckpointsByTip(
    sha: string,
    filters: FilterDefinition[]
  ) {
    const checkpoints = this.getCheckpoints(sha)
    if (!checkpoints) {
      return
    }
    const { unfiltered } = splitExperimentsByFilters(filters, checkpoints)
    return unfiltered
  }

  private getCheckpoints(id: string) {
    return this.checkpointsByTip
      .get(id)
      ?.map(checkpoint => this.addDetails(checkpoint))
  }

  private getExperimentsByBranch(branch: Experiment) {
    const experiments = this.experimentsByBranch
      .get(branch.label)
      ?.map(experiment => this.addDetails(experiment))
    if (!experiments) {
      return
    }
    return sortExperiments(this.getSorts(), experiments)
  }

  private getFlattenedExperiments() {
    return flattenMapValues(this.experimentsByBranch).map(experiment =>
      this.addDetails(experiment)
    )
  }

  private splitExperimentsByQueued(getQueued = false) {
    return this.getFlattenedExperiments().filter(({ queued }) => {
      if (getQueued) {
        return queued
      }
      return !queued
    })
  }

  private getFlattenedCheckpoints() {
    return flattenMapValues(this.checkpointsByTip).map(checkpoint =>
      this.addDetails(checkpoint)
    )
  }

  private setColoredStatus() {
    if (this.useFiltersForSelection) {
      this.setSelectedToFilters()
      return
    }
    const { coloredStatus, availableColors } = collectColoredStatus(
      this.getExperiments(),
      this.checkpointsByTip,
      this.experimentsByBranch,
      this.coloredStatus,
      this.availableColors
    )

    this.setColors(coloredStatus, availableColors)

    this.persistStatus()
  }

  private setColors(coloredStatus: ColoredStatus, availableColors: Color[]) {
    this.coloredStatus = coloredStatus
    this.availableColors = availableColors
  }

  private unassignColor(color: Color) {
    this.availableColors.unshift(color)
    this.availableColors = reorderListSubset(
      this.availableColors,
      copyOriginalColors()
    )
  }

  private setSelectedToFilters() {
    const filteredExperiments = this.getUnfilteredExperiments()
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

  private persistStars() {
    return this.persist(
      PersistenceKey.EXPERIMENTS_STARS,
      this.starredExperiments
    )
  }

  private persistStatus() {
    return this.persist(PersistenceKey.EXPERIMENTS_STATUS, this.coloredStatus)
  }

  private addDetails(experiment: Experiment) {
    const { id } = experiment

    const starred = !!this.isStarred(id)

    if (!hasKey(this.coloredStatus, id)) {
      return {
        ...experiment,
        selected: false,
        starred
      }
    }

    const selected = this.isSelected(id)

    return {
      ...experiment,
      displayColor: this.getDisplayColor(id),
      selected,
      starred
    }
  }

  private getDisplayColor(id: string) {
    const color = this.coloredStatus[id]
    if (!color) {
      return
    }
    return color
  }

  private getSelectedFromList(getList: () => Experiment[]) {
    const acc: SelectedExperimentWithColor[] = []

    for (const experiment of getList()) {
      const displayColor = this.coloredStatus[experiment.id]
      if (displayColor) {
        acc.push({ ...experiment, displayColor } as SelectedExperimentWithColor)
      }
    }

    return reorderObjectList<SelectedExperimentWithColor>(
      copyOriginalColors(),
      acc,
      'displayColor'
    )
  }
}
