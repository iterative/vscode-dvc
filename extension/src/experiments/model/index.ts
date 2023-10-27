import { Memento } from 'vscode'
import { SortDefinition, sortExperiments } from './sortBy'
import { FilterDefinition, filterExperiment, getFilterId } from './filterBy'
import { collectFiltered, collectUnfiltered } from './filterBy/collect'
import {
  collectAddRemoveCommitsDetails,
  collectExperiments,
  collectOrderedCommitsAndExperiments,
  collectRemoteExpShas,
  collectRunningInQueue,
  collectRunningInWorkspace
} from './collect'
import {
  collectColoredStatus,
  collectSelectable,
  collectSelectedColors,
  collectStartedRunningExperiments
} from './status/collect'
import { Color, copyOriginalColors } from './status/colors'
import { canSelect, ColoredStatus, UNSELECTED } from './status'
import { collectFlatExperimentParams } from './modify/collect'
import {
  Commit,
  Experiment,
  isQueued,
  isRunning,
  GitRemoteStatus,
  RunningExperiment,
  WORKSPACE_BRANCH,
  StudioLinkType
} from '../webview/contract'
import { reorderListSubset } from '../../util/array'
import {
  Executor,
  ExpShowOutput,
  ExecutorStatus,
  EXPERIMENT_WORKSPACE_ID
} from '../../cli/dvc/contract'
import { flattenMapValues } from '../../util/map'
import { ModelWithPersistence } from '../../persistence/model'
import { PersistenceKey } from '../../persistence/constants'
import { sum } from '../../util/math'
import {
  DEFAULT_CURRENT_BRANCH_COMMITS_TO_SHOW,
  DEFAULT_OTHER_BRANCH_COMMITS_TO_SHOW
} from '../../cli/dvc/constants'

type StarredExperiments = Record<string, boolean | undefined>

type SelectedExperimentWithColor = Experiment & {
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
  private cliError: undefined | string
  private commits: Experiment[] = []
  private experimentsByCommit: Map<string, Experiment[]> = new Map()
  private rowOrder: { branch: string; sha: string }[] = []
  private checkpoints = false
  private availableColors: Color[]
  private coloredStatus: ColoredStatus
  private starredExperiments: StarredExperiments
  private numberOfCommitsToShow: Record<string, number>
  private currentBranch: string | undefined
  private selectedBranches: string[] = []
  private availableBranchesToShow: string[] = []
  private availableBranchesToSelect: string[] = []
  private hasMoreCommits: { [branch: string]: boolean } = {}
  private isShowingMoreCommits: { [branch: string]: boolean } = {}

  private filters: Map<string, FilterDefinition> = new Map()

  private remoteExpShas?: Set<string>
  private pushing = new Set<string>()

  private studioLiveOnlyExperiments: { baselineSha: string; name: string }[] =
    []

  private studioPushedExperiments: string[] = []

  private currentSorts: SortDefinition[]
  private running: RunningExperiment[] = []
  private startedRunning: Set<string> = new Set()

  private dvcLiveOnlyExpName: string | undefined

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

    this.selectedBranches = this.revive<string[]>(
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

  public transformAndSetLocal(
    expShow: ExpShowOutput,
    gitLog: string,
    dvcLiveOnly: { running: boolean; expName?: string },
    rowOrder: { branch: string; sha: string }[],
    availableNbCommits: { [branch: string]: number }
  ) {
    const {
      cliError,
      commits,
      experimentsByCommit,
      hasCheckpoints,
      runningExperiments,
      workspace
    } = collectExperiments(expShow, gitLog, dvcLiveOnly.running)

    if (dvcLiveOnly.expName) {
      this.dvcLiveOnlyExpName = dvcLiveOnly.expName
    }

    const { hasMoreCommits, isShowingMoreCommits } =
      collectAddRemoveCommitsDetails(availableNbCommits, (branch: string) =>
        this.getNbOfCommitsToShow(branch)
      )

    this.hasMoreCommits = hasMoreCommits
    this.isShowingMoreCommits = isShowingMoreCommits

    commits.sort((a, b) => (b.Created || '').localeCompare(a.Created || ''))

    this.rowOrder = rowOrder
    this.workspace = workspace
    this.cliError = cliError
    this.commits = commits
    this.experimentsByCommit = experimentsByCommit
    this.checkpoints = hasCheckpoints

    const isTransientError = this.hasRunningExperiment() && workspace.error
    if (isTransientError) {
      return
    }
    this.setColoredStatus(runningExperiments)
  }

  public transformAndSetRemote(lsRemoteOutput: string) {
    const remoteExpShas = collectRemoteExpShas(lsRemoteOutput)
    this.remoteExpShas = remoteExpShas
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

    if (isQueued(experiment?.executorStatus)) {
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

  public transferDetails(oldName: string, newName: string) {
    const starred = this.starredExperiments[oldName]
    const selected = this.coloredStatus[oldName]

    this.starredExperiments[newName] = starred
    this.coloredStatus[newName] = selected

    delete this.starredExperiments[oldName]
    delete this.coloredStatus[oldName]

    this.persistStatus()
    this.persistStars()
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

  public getCliError() {
    return this.cliError
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
    return this.getCombinedList().map(({ id }) => id)
  }

  public getSelectedRevisions() {
    const acc: SelectedExperimentWithColor[] = []

    for (const experiment of this.getCombinedList()) {
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
    const possibleToSelect = collectSelectable(selectedExperiments)

    const { availableColors, coloredStatus } = collectSelectedColors(
      possibleToSelect,
      this.getWorkspaceCommitsAndExperiments(),
      this.coloredStatus,
      this.availableColors
    )

    this.setColors(coloredStatus, availableColors)

    this.persistStatus()
  }

  public setPushing(ids: string[]) {
    this.pushing = new Set(ids)
  }

  public unsetPushing(ids: string[]) {
    for (const id of ids) {
      this.pushing.delete(id)
    }
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
    const experiments = [
      {
        ...this.addDetails(this.workspace),
        hasChildren: false,
        type: this.running.some(
          ({ executor }) => executor === Executor.WORKSPACE
        )
          ? ExperimentType.RUNNING
          : ExperimentType.WORKSPACE
      }
    ]

    for (const commit of this.commits) {
      experiments.push({
        ...this.addDetails(commit),
        hasChildren: !!this.experimentsByCommit.get(commit.id),
        type: ExperimentType.COMMIT
      })
    }

    return experiments
  }

  public getWorkspaceCommitsAndExperiments() {
    return [...this.getWorkspaceAndCommits(), ...this.getExperiments()]
  }

  public getUnfilteredCommitsAndExperiments() {
    const filters = this.getFilters()
    return this.getWorkspaceCommitsAndExperiments().filter(
      exp =>
        exp.id !== EXPERIMENT_WORKSPACE_ID && !!filterExperiment(filters, exp)
    )
  }

  public getErrors() {
    const errors = new Set<string>()
    for (const { error, label } of this.getCombinedList()) {
      if (!error) {
        continue
      }
      errors.add(label)
    }
    if (this.cliError) {
      errors.add(this.cliError)
    }

    return errors
  }

  public getWorkspaceParams() {
    const params = this.workspace.params

    return collectFlatExperimentParams(params)
  }

  public getExperiments() {
    return this.getExperimentsAndQueued().filter(({ executorStatus }) => {
      return !isQueued(executorStatus)
    })
  }

  public getExperimentShas(id: string) {
    for (const experiment of this.getExperiments()) {
      if (experiment.id === id) {
        const { baselineSha, sha } = experiment
        return { baselineSha, sha }
      }
    }
    return { baselineSha: undefined, sha: undefined }
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
      isRunning(experiment.executorStatus)
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
    const workspaceRow = {
      branch: WORKSPACE_BRANCH,
      ...this.addDetails(this.workspace)
    }
    const sorts = this.getSorts()
    const flattenRowData = sorts.length > 0
    if (flattenRowData) {
      return this.getFlattenedRowData(workspaceRow)
    }

    const commitsBySha: { [sha: string]: Commit } = this.applyFiltersToCommits()
    const rows: Commit[] = [workspaceRow]

    for (const { branch, sha } of this.rowOrder) {
      const commit = commitsBySha[sha]
      if (!commit) {
        continue
      }
      if (commit.subRows) {
        commit.subRows = commit.subRows.map(experiment => ({
          ...experiment,
          branch
        }))
      }

      rows.push({ ...commit, branch })
    }

    return rows
  }

  public getHasMoreCommits() {
    return this.hasMoreCommits
  }

  public getIsShowingMoreCommits() {
    return this.isShowingMoreCommits
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

  public getRecordCount() {
    return this.getCombinedList().length
  }

  public getCombinedList() {
    return [this.workspace, ...this.commits, ...this.getExperimentsAndQueued()]
  }

  public getExperimentsByCommitForTree(commit: Experiment) {
    return this.getExperimentsByCommit(commit)?.map(experiment => ({
      ...experiment,
      hasChildren: false,
      type: this.getExperimentType(experiment.executorStatus)
    }))
  }

  public setNbfCommitsToShow(numberOfCommitsToShow: number, branch: string) {
    this.numberOfCommitsToShow[branch] = numberOfCommitsToShow
    this.persistNbOfCommitsToShow()
  }

  public resetNbfCommitsToShow(branch: string) {
    delete this.numberOfCommitsToShow[branch]
    this.persistNbOfCommitsToShow()
  }

  public getNbOfCommitsToShow(branch: string) {
    return (
      this.numberOfCommitsToShow[branch] ||
      (branch === this.currentBranch
        ? DEFAULT_CURRENT_BRANCH_COMMITS_TO_SHOW
        : DEFAULT_OTHER_BRANCH_COMMITS_TO_SHOW)
    )
  }

  public getAllNbOfCommitsToShow() {
    return this.numberOfCommitsToShow
  }

  public setBranches(
    branches: string[],
    branchesToSelect: string[],
    currentBranch: string
  ) {
    this.availableBranchesToShow = branches
    this.availableBranchesToSelect = branchesToSelect
    this.currentBranch = currentBranch

    this.selectedBranches = this.selectedBranches.filter(
      branch => branches.includes(branch) && branch !== this.currentBranch
    )
    this.persistBranchesToShow()
  }

  public setSelectedBranches(branches: string[]) {
    this.selectedBranches = branches.filter(
      branch => branch !== this.currentBranch
    )
    this.persistBranchesToShow()
  }

  public getBranchesToShow() {
    return [this.currentBranch as string, ...this.selectedBranches]
  }

  public getSelectedBranches() {
    return this.selectedBranches
  }

  public getAvailableBranchesToShow() {
    return this.availableBranchesToShow
  }

  public getAvailableBranchesToSelect() {
    return this.availableBranchesToSelect
  }

  public addBranch(branch: string) {
    const selectedBranches: string[] = this.getSelectedBranches()
    const branchesWithNewBranch = [...selectedBranches, branch].sort()

    this.setSelectedBranches(branchesWithNewBranch)
  }

  public setStudioData(
    live: { baselineSha: string; name: string }[],
    pushed: string[]
  ) {
    this.studioLiveOnlyExperiments = live
    this.studioPushedExperiments = pushed
  }

  public assumePushed(shas: string[]) {
    for (const sha of shas) {
      if (this.studioPushedExperiments.includes(sha)) {
        continue
      }
      this.studioPushedExperiments.push(sha)
    }
  }

  public hasDvcLiveOnlyRunning() {
    return !!this.dvcLiveOnlyExpName
  }

  public checkWorkspaceDuplicated(fetched: string[]) {
    if (!this.dvcLiveOnlyExpName) {
      return false
    }

    const newExperimentFetched = fetched.includes(this.dvcLiveOnlyExpName)
    const workspaceSelectionDuplicated =
      this.coloredStatus[EXPERIMENT_WORKSPACE_ID] ===
      this.coloredStatus[this.dvcLiveOnlyExpName]

    if (newExperimentFetched && workspaceSelectionDuplicated) {
      this.coloredStatus[EXPERIMENT_WORKSPACE_ID] = UNSELECTED
      this.dvcLiveOnlyExpName = undefined
      this.persistStatus()
      return true
    }
  }

  private findIndexByPath(pathToRemove: string) {
    return this.currentSorts.findIndex(({ path }) => path === pathToRemove)
  }

  private getFilteredExperiments() {
    const acc: Experiment[] = []

    for (const commit of this.commits) {
      const experiments = this.getExperimentsByCommit(commit)
      collectFiltered(
        acc,
        this.addDetails(commit),
        experiments,
        this.getFilters()
      )
    }

    return acc
  }

  private getExperimentsByCommit(commit: Experiment) {
    const experiments = this.experimentsByCommit
      .get(commit.id)
      ?.map(originalExperiment => {
        const experiment = this.addDetails(originalExperiment)

        this.addRemoteStatus(experiment)
        this.addStudioLinkType(experiment, commit.sha)

        return experiment
      })
    if (!experiments) {
      return
    }
    return sortExperiments(this.getSorts(), experiments)
  }

  private addRemoteStatus(experiment: Experiment) {
    if (
      this.remoteExpShas === undefined ||
      !experiment.sha ||
      ![undefined, ExecutorStatus.SUCCESS].includes(experiment.executorStatus)
    ) {
      return
    }
    if (this.pushing.has(experiment.id)) {
      experiment.gitRemoteStatus = GitRemoteStatus.PUSHING
      return
    }

    experiment.gitRemoteStatus = this.remoteExpShas.has(experiment.sha)
      ? GitRemoteStatus.ON_REMOTE
      : GitRemoteStatus.NOT_ON_REMOTE
  }

  private addStudioLinkType(
    experiment: Experiment,
    baselineSha: string | undefined
  ) {
    if (
      this.studioLiveOnlyExperiments.length === 0 &&
      this.studioPushedExperiments.length === 0
    ) {
      return
    }

    if (
      experiment.sha &&
      this.studioPushedExperiments.includes(experiment.sha)
    ) {
      experiment.studioLinkType = StudioLinkType.PUSHED
      return
    }

    if (
      this.studioLiveOnlyExperiments.some(
        ({ baselineSha: expBaselineSha, name }) =>
          baselineSha === expBaselineSha && experiment.id === name
      )
    ) {
      experiment.studioLinkType = StudioLinkType.LIVE
    }
  }

  private setColoredStatus(runningExperiments: RunningExperiment[]) {
    this.setRunning(runningExperiments)

    const { coloredStatus, availableColors } = collectColoredStatus(
      this.getWorkspaceAndCommits(),
      this.experimentsByCommit,
      this.coloredStatus,
      this.availableColors,
      this.startedRunning,
      this.dvcLiveOnlyExpName
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
      this.selectedBranches
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

  private getExperimentType(executorStatus?: ExecutorStatus) {
    if (isQueued(executorStatus)) {
      return ExperimentType.QUEUED
    }
    if (isRunning(executorStatus)) {
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

  private applyFiltersToCommits() {
    const commitsBySha: { [sha: string]: Commit } = {}
    for (const commit of this.commits) {
      const commitWithSelectedAndStarred = this.addDetails(commit)
      const experiments = this.getExperimentsByCommit(
        commitWithSelectedAndStarred
      )
      const unfilteredCommit = collectUnfiltered(
        commitWithSelectedAndStarred,
        experiments,
        this.getFilters()
      )
      if (!unfilteredCommit) {
        continue
      }

      commitsBySha[commit.sha as string] = unfilteredCommit
    }
    return commitsBySha
  }

  private applyFiltersToFlattenedCommits() {
    const commitsBySha: { [sha: string]: Commit[] } = {}
    const filters = this.getFilters()

    for (const commit of this.commits) {
      const commitWithSelectedAndStarred = this.addDetails(commit)
      const experiments = this.getExperimentsByCommit(
        commitWithSelectedAndStarred
      )

      commitsBySha[commit.sha as string] = [
        commitWithSelectedAndStarred,
        ...(experiments || [])
      ].filter(exp => !!filterExperiment(filters, exp))
    }

    return commitsBySha
  }

  private getFlattenedRowData(workspaceRow: Commit): Commit[] {
    const branchesBySha: { [sha: string]: string[] } = {}
    for (const { branch, sha } of this.rowOrder) {
      if (!branchesBySha[sha]) {
        branchesBySha[sha] = []
      }
      branchesBySha[sha].push(branch)
    }

    const commitsBySha: { [sha: string]: Commit[] } =
      this.applyFiltersToFlattenedCommits()
    const rows: Commit[] = []
    for (const [sha, commitAndExps] of Object.entries(commitsBySha)) {
      const flatBranches = branchesBySha[sha]

      if (!flatBranches) {
        continue
      }

      rows.push(
        ...commitAndExps.map(commitOrExp => ({ ...commitOrExp, flatBranches }))
      )
    }
    return [workspaceRow, ...sortExperiments(this.getSorts(), rows)]
  }
}
