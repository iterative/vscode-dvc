import { Memento } from 'vscode'
import { SortDefinition, sortExperiments } from './sortBy'
import { FilterDefinition, filterExperiment, getFilterId } from './filterBy'
import { collectExperiments } from './collect'
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

export enum ExperimentType {
  WORKSPACE = 'workspace',
  COMMIT = 'commit',
  EXPERIMENT = 'experiment',
  QUEUED = 'queued'
}

export class ExperimentsModel extends ModelWithPersistence {
  private workspace = {} as Experiment
  private commits: Experiment[] = []
  private experimentsByCommit: Map<string, Experiment[]> = new Map()
  private availableColors: Color[]
  private coloredStatus: ColoredStatus
  private starredExperiments: StarredExperiments
  private numberOfCommitsToShow: number
  private isBranchesView: boolean
  private branchesToShow: string[] = []
  private availableBranchesToShow: string[] = []

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

    this.branchesToShow = this.revive<string[]>(
      PersistenceKey.EXPERIMENTS_BRANCHES,
      []
    )

    const assignedColors = new Set(
      Object.values(this.coloredStatus).filter(Boolean)
    )
    this.availableColors = copyOriginalColors().filter(
      color => !assignedColors.has(color)
    )

    this.isBranchesView = false
  }

  public transformAndSet(
    data: ExperimentsOutput,
    dvcLiveOnly: boolean,
    commitsOutput: string
  ) {
    const { workspace, commits, experimentsByCommit, runningExperiments } =
      collectExperiments(data, dvcLiveOnly, commitsOutput)

    this.workspace = workspace
    this.commits = commits
    this.experimentsByCommit = experimentsByCommit

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

  public getExperimentRevisions() {
    return this.getExperiments().map(({ id, label }) => ({ id, label }))
  }

  public getRevisions() {
    return this.getCombinedList().map(({ label }) => label)
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
      selectedExperiments.filter(({ status }) => !isQueued(status)),
      this.getWorkspaceCommitsAndExperiments(),
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

  public getWorkspaceAndCommits() {
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

  public getWorkspaceCommitsAndExperiments() {
    return [...this.getWorkspaceAndCommits(), ...this.getExperiments()]
  }

  public getErrors() {
    return new Set(
      this.getCombinedList()
        .filter(({ error }) => error)
        .map(({ label }) => label)
    )
  }

  public getExperimentParams(id: string) {
    const params = this.getCombinedList().find(
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
          subRows: experiments.filter(
            (experiment: Experiment) =>
              !!filterExperiment(this.getFilters(), experiment)
          )
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
    return sum([this.getExperimentsAndQueued().length, this.commits.length, 1])
  }

  public getFilteredCount() {
    const filtered = this.getFilteredExperiments()
    return filtered.length
  }

  public getCombinedList() {
    return [this.workspace, ...this.commits, ...this.getExperimentsAndQueued()]
  }

  public getExperimentsByCommitForTree(commit: Experiment) {
    return this.getExperimentsByCommit(commit)?.map(experiment => ({
      ...experiment,
      hasChildren: false,
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

  public setIsBranchesView(isBranchesView: boolean) {
    this.isBranchesView = isBranchesView
  }

  public getIsBranchesView() {
    return this.isBranchesView
  }

  public selectBranchesToShow(branches: string[]) {
    this.branchesToShow = branches
    this.persistBranchesToShow()
  }

  public getBranchesToShow() {
    return this.branchesToShow
  }

  public setAvailableBranchesToShow(branches: string[]) {
    this.availableBranchesToShow = branches
  }

  public getAvailableBranchesToShow() {
    return this.availableBranchesToShow
  }

  private findIndexByPath(pathToRemove: string) {
    return this.currentSorts.findIndex(({ path }) => path === pathToRemove)
  }

  private getFilteredExperiments() {
    const acc: Experiment[] = []

    for (const experiment of this.getExperiments()) {
      if (!filterExperiment(this.getFilters(), experiment)) {
        acc.push(experiment)
      }
    }

    return acc
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

  private setColoredStatus(runningExperiments: RunningExperiment[]) {
    this.setRunning(runningExperiments)

    const { coloredStatus, availableColors } = collectColoredStatus(
      this.getWorkspaceAndCommits(),
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

  private persistBranchesToShow() {
    return this.persist(
      PersistenceKey.EXPERIMENTS_BRANCHES,
      this.branchesToShow
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
