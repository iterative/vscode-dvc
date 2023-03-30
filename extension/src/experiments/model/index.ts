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
import {
  collectColoredStatus,
  collectFinishedRunningExperiments,
  collectSelected,
  collectStartedRunningExperiments
} from './status/collect'
import { Color, copyOriginalColors } from './status/colors'
import {
  canSelect,
  limitToMaxSelected,
  ColoredStatus,
  tooManySelected,
  UNSELECTED
} from './status'
import { collectFlatExperimentParams } from './modify/collect'
import {
  Experiment,
  isQueued,
  isRunningInQueue,
  Row,
  RunningExperiment
} from '../webview/contract'
import {
  definedAndNonEmpty,
  reorderListSubset,
  reorderObjectList
} from '../../util/array'
import {
  ExperimentsOutput,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'
import { flattenMapValues } from '../../util/map'
import { ModelWithPersistence } from '../../persistence/model'
import { PersistenceKey } from '../../persistence/constants'
import { sum } from '../../util/math'
import { DEFAULT_NUM_OF_COMMITS_TO_SHOW } from '../../cli/dvc/constants'

export type StarredExperiments = Record<string, boolean | undefined>

export type SelectedExperimentWithColor = Experiment & {
  displayColor: Color
  selected: true
}

export type ExperimentWithCheckpoints = Experiment & {
  checkpoints?: Experiment[]
}

export type ExperimentWithDefinedCheckpoints = Experiment & {
  checkpoints: Experiment[]
}

export enum ExperimentType {
  WORKSPACE = 'workspace',
  COMMIT = 'commit',
  EXPERIMENT = 'experiment',
  CHECKPOINT = 'checkpoint',
  QUEUED = 'queued'
}

export class ExperimentsModel extends ModelWithPersistence {
  private workspace = {} as Experiment
  private commits: Experiment[] = []
  private experimentsByCommit: Map<string, Experiment[]> = new Map()
  private checkpointsByTip: Map<string, Experiment[]> = new Map()
  private availableColors: Color[]
  private coloredStatus: ColoredStatus
  private starredExperiments: StarredExperiments
  private numberOfCommitsToShow: number

  private filters: Map<string, FilterDefinition> = new Map()

  private currentSorts: SortDefinition[]
  private running: RunningExperiment[] = []
  private finishedRunning: { [id: string]: string } = {}
  private startedRunning: Set<string> = new Set()

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
    this.numberOfCommitsToShow = this.revive<number>(
      PersistenceKey.NUMBER_OF_COMMITS_TO_SHOW,
      DEFAULT_NUM_OF_COMMITS_TO_SHOW
    )

    const assignedColors = new Set(
      Object.values(this.coloredStatus).filter(Boolean)
    )
    this.availableColors = copyOriginalColors().filter(
      color => !assignedColors.has(color)
    )
  }

  public transformAndSet(
    data: ExperimentsOutput,
    dvcLiveOnly: boolean,
    commitsOutput: string
  ) {
    const {
      workspace,
      commits,
      experimentsByCommit,
      checkpointsByTip,
      runningExperiments
    } = collectExperiments(data, dvcLiveOnly, commitsOutput)

    this.workspace = workspace
    this.commits = commits
    this.experimentsByCommit = experimentsByCommit
    this.checkpointsByTip = checkpointsByTip

    this.setColoredStatus(runningExperiments)
  }

  public toggleStars(ids: string[]) {
    for (const id of ids) {
      this.starredExperiments[id] = !this.starredExperiments[id]
      this.persistStars()
    }
  }

  public toggleStatus(id: string) {
    if (
      isQueued(
        this.getExperimentsAndQueued().find(
          ({ id: queuedId }) => queuedId === id
        )?.status
      )
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

    this.persistStatus()
    return this.coloredStatus[id]
  }

  public hasRunningExperiment() {
    return this.running.length > 0
  }

  public isRunningInWorkspace(id: string) {
    if (id === EXPERIMENT_WORKSPACE_ID) {
      return false
    }

    return this.running.some(
      ({ id: runningId, executor }) =>
        executor === EXPERIMENT_WORKSPACE_ID && runningId === id
    )
  }

  public setRevisionCollected(revisions: string[]) {
    for (const { id } of this.getExperimentsAndQueued().filter(({ label }) =>
      revisions.includes(label)
    )) {
      if (this.finishedRunning[id]) {
        delete this.finishedRunning[id]
      }
    }
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

  public addFilter(filter: FilterDefinition) {
    this.filters.set(getFilterId(filter), filter)
    this.applyAndPersistFilters()
  }

  public removeFilters(filterIds: string[]) {
    for (const id of filterIds) {
      this.removeFilter(id)
    }
  }

  public removeFilter(id: string) {
    const result = this.filters.delete(id)
    this.applyAndPersistFilters()
    return result
  }

  public getCommitRevisions() {
    return this.commits.map(({ id, sha }) => ({ id, sha }))
  }

  public getRevisions() {
    return this.getCombinedList().map(({ label }) => label)
  }

  public getMutableRevisions(hasCheckpoints: boolean) {
    return collectMutableRevisions(
      this.getRecordsWithoutCheckpoints(),
      hasCheckpoints
    )
  }

  public getSelectedRevisions() {
    return this.getSelectedFromList(() => this.getCombinedList())
  }

  public getSelectedExperiments() {
    return this.getSelectedFromList(() => this.getExperimentsAndQueued())
  }

  public setSelected(selectedExperiments: Experiment[]) {
    if (tooManySelected(selectedExperiments)) {
      selectedExperiments = limitToMaxSelected(selectedExperiments)
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

  public getLabels() {
    return this.getCombinedList().map(({ label }) => label)
  }

  public getLabelsToDecorate() {
    return new Set<string>(
      this.getFilteredExperiments().map(({ label }) => label)
    )
  }

  public getWorkspaceAndCommits(): ExperimentAugmented[] {
    return [
      {
        ...this.addDetails(this.workspace),
        hasChildren: false,
        type: ExperimentType.WORKSPACE
      },
      ...this.commits.map(commit => {
        return {
          ...this.addDetails(commit),
          hasChildren: !!this.experimentsByCommit.get(commit.label),
          type: ExperimentType.COMMIT
        }
      })
    ]
  }

  public getRecordsWithoutCheckpoints() {
    return [...this.getWorkspaceAndCommits(), ...this.getExperimentsAndQueued()]
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
    for (const experiment of this.getRecordsWithoutCheckpoints()) {
      const { id, status } = experiment
      if (isQueued(status)) {
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
    const params = this.getRecordsWithoutCheckpoints().find(
      experiment => experiment.id === id
    )?.params

    return collectFlatExperimentParams(params)
  }

  public getExperiments() {
    return this.getExperimentsAndQueued().filter(({ status }) => {
      return !isQueued(status)
    })
  }

  public getExperimentsAndQueued() {
    return flattenMapValues(this.experimentsByCommit).map(experiment =>
      this.addDetails(experiment)
    )
  }

  public getRunningQueueTasks() {
    return this.getExperimentsAndQueued().filter(experiment =>
      isRunningInQueue(experiment)
    )
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
      ...this.commits.map(commit => {
        const experiments = this.getExperimentsByCommit(commit)
        const commitWithSelectedAndStarred = this.addDetails(commit)

        if (!definedAndNonEmpty(experiments)) {
          return commitWithSelectedAndStarred
        }

        return {
          ...commitWithSelectedAndStarred,
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
      this.getExperimentsAndQueued().length,
      this.commits.length,
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
      ...this.commits,
      ...this.getExperimentsAndQueued(),
      ...this.getFlattenedCheckpoints()
    ]
  }

  public getExperimentsByCommitForTree(commit: Experiment) {
    return this.getExperimentsByCommit(commit)?.map(experiment => ({
      ...experiment,
      hasChildren: definedAndNonEmpty(this.checkpointsByTip.get(experiment.id)),
      type: isQueued(experiment.status)
        ? ExperimentType.QUEUED
        : ExperimentType.EXPERIMENT
    }))
  }

  public getFinishedExperiments() {
    return this.finishedRunning
  }

  public setNbfCommitsToShow(numberOfCommitsToShow: number) {
    this.numberOfCommitsToShow = numberOfCommitsToShow
    this.persistNbOfCommitsToShow()
  }

  public getNbOfCommitsToShow() {
    return this.numberOfCommitsToShow
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

    for (const experiment of this.getExperiments()) {
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

  private getExperimentsByCommit(commit: Experiment) {
    const experiments = this.experimentsByCommit
      .get(commit.label)
      ?.map(experiment => this.addDetails(experiment))
    if (!experiments) {
      return
    }
    return sortExperiments(this.getSorts(), experiments)
  }

  private getFlattenedCheckpoints() {
    return flattenMapValues(this.checkpointsByTip).map(checkpoint =>
      this.addDetails(checkpoint)
    )
  }

  private setColoredStatus(runningExperiments: RunningExperiment[]) {
    this.setRunning(runningExperiments)

    const { coloredStatus, availableColors } = collectColoredStatus(
      this.getWorkspaceAndCommits(),
      this.checkpointsByTip,
      this.experimentsByCommit,
      this.coloredStatus,
      this.availableColors,
      this.startedRunning,
      this.finishedRunning
    )
    this.startedRunning = new Set()

    this.setColors(coloredStatus, availableColors)

    this.persistStatus()
  }

  private setRunning(stillRunning: RunningExperiment[]) {
    this.startedRunning = collectStartedRunningExperiments(
      this.running,
      stillRunning
    )

    this.finishedRunning = collectFinishedRunningExperiments(
      { ...this.finishedRunning },
      this.getExperimentsAndQueued(),
      this.running,
      stillRunning,
      this.coloredStatus
    )

    this.running = stillRunning
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

  private persistSorts() {
    return this.persist(PersistenceKey.EXPERIMENTS_SORT_BY, this.currentSorts)
  }

  private applyAndPersistFilters() {
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

  private persistNbOfCommitsToShow() {
    return this.persist(
      PersistenceKey.NUMBER_OF_COMMITS_TO_SHOW,
      this.numberOfCommitsToShow
    )
  }

  private addDetails(experiment: Experiment) {
    const { id } = experiment

    return {
      ...experiment,
      displayColor: this.getDisplayColor(id),
      selected: this.isSelected(id),
      starred: !!this.isStarred(id)
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
