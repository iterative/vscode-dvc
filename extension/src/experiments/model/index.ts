import { Memento } from 'vscode'
import { SortDefinition, sortExperiments } from './sortBy'
import { FilterDefinition, filterExperiment, getFilterId } from './filterBy'
import {
  collectExperiments,
  collectOrderedCommitsAndExperiments,
  collectRunningInQueue,
  collectRunningInWorkspace
} from './collect'
import {
  collectColoredStatus,
  collectFinishedRunningExperiments,
  collectSelectable,
  collectSelectedColors,
  collectStartedRunningExperiments
} from './status/collect'
import { Color, copyOriginalColors } from './status/colors'
import { canSelect, ColoredStatus, UNSELECTED } from './status'
import { collectFlatExperimentParams } from './modify/collect'
import {
  Experiment,
  isQueued,
  isRunning,
  isRunningInQueue,
  RunningExperiment
} from '../webview/contract'
import { definedAndNonEmpty, reorderListSubset } from '../../util/array'
import {
  EXPERIMENT_WORKSPACE_ID,
  Executor,
  ExpShowOutput,
  ExperimentStatus
} from '../../cli/dvc/contract'
import { flattenMapValues } from '../../util/map'
import { ModelWithPersistence } from '../../persistence/model'
import { PersistenceKey } from '../../persistence/constants'
import { sum } from '../../util/math'
import { DEFAULT_NUM_OF_COMMITS_TO_SHOW } from '../../cli/dvc/constants'

type StarredExperiments = Record<string, boolean | undefined>

export type SelectedExperimentWithColor = Experiment & {
  displayColor: Color
  selected: true
}

export enum ExperimentType {
  COMMIT = 'commit',
  EXPERIMENT = 'experiment',
  RUNNING = 'running',
  QUEUED = 'queued',
  WORKSPACE = 'workspace'
}

export class ExperimentsModel extends ModelWithPersistence {
  private workspace = {} as Experiment
  private commits: Experiment[] = []
  private experimentsByCommit: Map<string, Experiment[]> = new Map()
  private checkpoints = false
  private availableColors: Color[]
  private coloredStatus: ColoredStatus
  private starredExperiments: StarredExperiments
  private numberOfCommitsToShow: Record<string, number>
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

    this.coloredStatus = this.reviveColoredStatus()
    this.starredExperiments = this.revive<StarredExperiments>(
      PersistenceKey.EXPERIMENTS_STARS,
      {}
    )
    this.numberOfCommitsToShow = this.revive<Record<string, number>>(
      PersistenceKey.NUMBER_OF_COMMITS_TO_SHOW,
      {}
    )

    if (typeof this.numberOfCommitsToShow === 'number') {
      this.numberOfCommitsToShow = {}
    }

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
  }

  public transformAndSet(
    data: ExpShowOutput,
    dvcLiveOnly: boolean,
    commitsOutput: string | undefined
  ) {
    const {
      workspace,
      commits,
      experimentsByCommit,
      runningExperiments,
      hasCheckpoints
    } = collectExperiments(data, dvcLiveOnly, commitsOutput)

    this.workspace = workspace
    this.commits = commits
    this.experimentsByCommit = experimentsByCommit
    this.checkpoints = hasCheckpoints

    this.setColoredStatus(runningExperiments)
  }

  public toggleStars(ids: string[]) {
    for (const id of ids) {
      this.starredExperiments[id] = !this.starredExperiments[id]
      this.persistStars()
    }
  }

  public toggleStatus(id: string) {
    const experiment = this.getExperimentsAndQueued().find(
      ({ id: expId }) => expId === id
    )

    if (experiment && isRunning(experiment.status)) {
      return this.preventSelectionOfRunningExperiment(experiment)
    }

    if (isQueued(experiment?.status)) {
      return UNSELECTED
    }

    const current = this.coloredStatus[id]
    if (current) {
      this.coloredStatus[id] = UNSELECTED
      this.unassignColor(current)
    } else if (this.availableColors.length > 0) {
      this.coloredStatus[id] = this.availableColors.shift() as Color
    }

    this.persistStatus()
    return this.coloredStatus[id]
  }

  public unselectWorkspace() {
    this.coloredStatus[EXPERIMENT_WORKSPACE_ID] = UNSELECTED
  }

  public hasRunningExperiment() {
    return this.running.length > 0
  }

  public hasRunningWorkspaceExperiment() {
    return this.running.some(({ executor }) => executor === Executor.WORKSPACE)
  }

  public hasCheckpoints() {
    return this.checkpoints
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

  public getRevisionIds() {
    return this.getUniqueList().map(({ id }) => id)
  }

  public getSelectedRevisions() {
    const acc: SelectedExperimentWithColor[] = []

    for (const experiment of this.getUniqueList()) {
      const { id } = experiment
      const displayColor = this.coloredStatus[id]
      if (displayColor) {
        acc.push({ ...experiment, displayColor } as SelectedExperimentWithColor)
      }
    }

    return copyOriginalColors()
      .flatMap(orderedItem =>
        acc.filter(item => item.displayColor === orderedItem)
      )
      .filter(Boolean)
  }

  public setSelected(selectedExperiments: Experiment[]) {
    const possibleToSelect = collectSelectable(selectedExperiments, {
      ...this.workspace
    })

    const { availableColors, coloredStatus } = collectSelectedColors(
      possibleToSelect,
      this.getWorkspaceCommitsAndExperiments(),
      this.coloredStatus,
      this.availableColors
    )

    this.setColors(coloredStatus, availableColors)

    this.persistStatus()
  }

  public getLabels() {
    return this.getUniqueList().map(({ label }) => label)
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
        type: this.running.some(
          ({ executor }) => executor === Executor.WORKSPACE
        )
          ? ExperimentType.RUNNING
          : ExperimentType.WORKSPACE
      },
      ...this.commits.map(commit => {
        return {
          ...this.addDetails(commit),
          hasChildren: !!this.experimentsByCommit.get(commit.id),
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
      this.getUniqueList()
        .filter(({ error }) => error)
        .map(({ label }) => label)
    )
  }

  public getExperimentParams(id: string) {
    const params = this.getUniqueList().find(
      experiment => experiment.id === id
    )?.params

    return collectFlatExperimentParams(params)
  }

  public getExperiments() {
    return this.getExperimentsAndQueued().filter(({ status }) => {
      return !isQueued(status)
    })
  }

  public getCommitsAndExperiments() {
    return collectOrderedCommitsAndExperiments(this.commits, commit =>
      this.getExperimentsByCommit(commit)
    )
  }

  public getExperimentsAndQueued() {
    return flattenMapValues(this.experimentsByCommit).map(experiment =>
      this.addDetails(experiment)
    )
  }

  public getRunningExperiments() {
    return this.getExperimentsAndQueued().filter(experiment =>
      isRunning(experiment.status)
    )
  }

  public getStopDetails(idsToStop: string[]) {
    const running = [...this.running]
    const ids = new Set(idsToStop)
    return {
      runningInQueueIds: collectRunningInQueue(ids, running),
      runningInWorkspaceId: collectRunningInWorkspace(ids, running)
    }
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

  public getUniqueList() {
    const uniqueList: Experiment[] = [this.workspace]
    const ids = new Set<string>()

    for (const experiment of [
      ...this.commits,
      ...this.getExperimentsAndQueued()
    ]) {
      const { id } = experiment
      if (ids.has(id)) {
        continue
      }

      uniqueList.push(experiment)
      ids.add(id)
    }

    return uniqueList
  }

  public getExperimentsByCommitForTree(commit: Experiment) {
    return this.getExperimentsByCommit(commit)?.map(experiment => ({
      ...experiment,
      hasChildren: false,
      type: this.getExperimentType(experiment.status)
    }))
  }

  public getFinishedExperiments() {
    return this.finishedRunning
  }

  public setNbfCommitsToShow(numberOfCommitsToShow: number, branch: string) {
    this.numberOfCommitsToShow[branch] = numberOfCommitsToShow
    this.persistNbOfCommitsToShow()
  }

  public getNbOfCommitsToShow(branch: string) {
    return this.numberOfCommitsToShow[branch] || DEFAULT_NUM_OF_COMMITS_TO_SHOW
  }

  public getAllNbOfCommitsToShow() {
    return this.numberOfCommitsToShow
  }

  public setBranchesToShow(branches: string[]) {
    this.branchesToShow = branches
    this.persistBranchesToShow()
  }

  public pruneBranchesToShow(branches: string[]) {
    this.branchesToShow = this.branchesToShow.filter(branch =>
      branches.includes(branch)
    )
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
      .get(commit.id)
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
    if (new Set(Object.values(this.coloredStatus)).has(color)) {
      return
    }

    this.availableColors.unshift(color)
    this.availableColors = reorderListSubset(
      this.availableColors,
      copyOriginalColors()
    )
  }

  private preventSelectionOfRunningExperiment(
    experiment: Experiment
  ): Color | undefined | typeof UNSELECTED {
    if (isRunningInQueue(experiment)) {
      return UNSELECTED
    }

    const { executor, id } = experiment
    if (
      executor === Executor.WORKSPACE &&
      id !== EXPERIMENT_WORKSPACE_ID &&
      !this.isSelected(id) &&
      !this.isSelected(EXPERIMENT_WORKSPACE_ID)
    ) {
      return this.toggleStatus(EXPERIMENT_WORKSPACE_ID)
    }
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

  private getExperimentType(status?: ExperimentStatus) {
    if (isQueued(status)) {
      return ExperimentType.QUEUED
    }
    if (isRunning(status)) {
      return ExperimentType.RUNNING
    }

    return ExperimentType.EXPERIMENT
  }

  private getDisplayColor(id: string) {
    const color = this.coloredStatus[id]
    if (!color) {
      return
    }
    return color
  }

  private reviveColoredStatus() {
    const uniqueStatus: ColoredStatus = {}
    const colors = new Set<Color>()
    for (const [id, color] of Object.entries(
      this.revive<ColoredStatus>(PersistenceKey.EXPERIMENTS_STATUS, {})
    )) {
      if (color) {
        uniqueStatus[id] = colors.has(color) ? UNSELECTED : color
        colors.add(color)
        continue
      }
      uniqueStatus[id] = UNSELECTED
    }
    return uniqueStatus
  }
}
