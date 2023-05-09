import { join } from 'path'
import {
  ConfigurationChangeEvent,
  Event,
  EventEmitter,
  Memento,
  workspace
} from 'vscode'
import omit from 'lodash.omit'
import { addStarredToColumns } from './columns/like'
import { setContextForEditorTitleIcons } from './context'
import { ExperimentsModel } from './model'
import {
  pickExperiment,
  pickExperiments,
  pickExperimentsToPlot
} from './model/quickPick'
import { pickAndModifyParams } from './model/modify/quickPick'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { Color } from './model/status/colors'
import {
  FetchedExperiment,
  hasFinishedWorkspaceExperiment
} from './model/status/collect'
import { UNSELECTED } from './model/status'
import { starredSort } from './model/sortBy/constants'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { ColumnsModel } from './columns/model'
import { ExperimentsData } from './data'
import { stopWorkspaceExperiment } from './processExecution'
import {
  Experiment,
  ColumnType,
  TableData,
  isRunning
} from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { DecorationProvider } from './model/decorationProvider'
import { starredFilter } from './model/filterBy/constants'
import { ResourceLocator } from '../resourceLocator'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { ExpShowOutput } from '../cli/dvc/contract'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Title } from '../vscode/title'
import { createTypedAccumulator } from '../util/object'
import { pickPaths } from '../path/selection/quickPick'
import { Toast } from '../vscode/toast'
import { ConfigKey } from '../vscode/config'
import { checkSignalFile, pollSignalFileForProcess } from '../fileSystem'
import { DVCLIVE_ONLY_RUNNING_SIGNAL_FILE } from '../cli/dvc/constants'

export const ExperimentsScale = {
  ...omit(ColumnType, 'TIMESTAMP'),
  HAS_CHECKPOINTS: 'hasCheckpoints',
  NO_CHECKPOINTS: 'noCheckpoints'
} as const

export type ModifiedExperimentAndRunCommandId =
  | typeof AvailableCommands.EXPERIMENT_RUN
  | typeof AvailableCommands.EXPERIMENT_RESET_AND_RUN

export class Experiments extends BaseRepository<TableData> {
  public readonly onDidChangeIsParamsFileFocused: Event<string | undefined>
  public readonly onDidChangeExperiments: Event<void>
  public readonly onDidChangeColumns: Event<void>
  public readonly onDidChangeColumnOrderOrStatus: Event<void>
  public readonly onDidChangeCheckpoints: Event<void>

  public readonly viewKey = ViewKey.EXPERIMENTS

  private readonly data: ExperimentsData

  private readonly experiments: ExperimentsModel
  private readonly columns: ColumnsModel

  private readonly paramsFileFocused = this.dispose.track(
    new EventEmitter<string | undefined>()
  )

  private readonly experimentsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly checkpointsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly columnsChanged = this.dispose.track(new EventEmitter<void>())
  private readonly columnsOrderOrStatusChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly decorationProvider = this.dispose.track(
    new DecorationProvider()
  )

  private readonly internalCommands: InternalCommands
  private readonly webviewMessages: WebviewMessages

  private dvcLiveOnlyCleanupInitialized = false
  private dvcLiveOnlySignalFile: string

  private readonly addStage: () => Promise<boolean>
  private readonly selectBranches: (
    branchesSelected: string[]
  ) => Promise<string[] | undefined>

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator,
    workspaceState: Memento,
    addStage: () => Promise<boolean>,
    selectBranches: (
      branchesSelected: string[]
    ) => Promise<string[] | undefined>,
    data?: ExperimentsData
  ) {
    super(dvcRoot, resourceLocator.beaker)

    this.dvcLiveOnlySignalFile = join(
      this.dvcRoot,
      DVCLIVE_ONLY_RUNNING_SIGNAL_FILE
    )

    this.internalCommands = internalCommands
    this.addStage = addStage
    this.selectBranches = selectBranches

    this.onDidChangeIsParamsFileFocused = this.paramsFileFocused.event
    this.onDidChangeExperiments = this.experimentsChanged.event
    this.onDidChangeColumns = this.columnsChanged.event
    this.onDidChangeColumnOrderOrStatus = this.columnsOrderOrStatusChanged.event
    this.onDidChangeCheckpoints = this.checkpointsChanged.event

    this.experiments = this.dispose.track(
      new ExperimentsModel(dvcRoot, workspaceState)
    )

    this.columns = this.dispose.track(
      new ColumnsModel(
        dvcRoot,
        workspaceState,
        this.columnsOrderOrStatusChanged
      )
    )

    this.data = this.dispose.track(
      data || new ExperimentsData(dvcRoot, internalCommands, this.experiments)
    )

    this.dispose.track(this.data.onDidUpdate(data => this.setState(data)))
    this.dispose.track(
      this.data.onDidChangeDvcYaml(() =>
        this.webviewMessages.changeHasConfig(true)
      )
    )

    this.dispose.track(
      workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
        if (event.affectsConfiguration(ConfigKey.EXP_TABLE_HEAD_MAX_HEIGHT)) {
          void this.data.update()
        }
      })
    )

    this.webviewMessages = this.createWebviewMessageHandler()
    this.setupInitialData()
    this.watchActiveEditor()
  }

  public update() {
    return this.data.managedUpdate()
  }

  public async setState(data: ExpShowOutput) {
    const hadCheckpoints = this.hasCheckpoints()
    const dvcLiveOnly = await this.checkSignalFile()
    const commitsOutput = await this.getCommitOutput(data)
    await Promise.all([
      this.columns.transformAndSet(data),
      this.experiments.transformAndSet(data, dvcLiveOnly, commitsOutput)
    ])

    if (hadCheckpoints !== this.hasCheckpoints()) {
      this.checkpointsChanged.fire()
    }

    return this.notifyChanged()
  }

  public hasCheckpoints() {
    return this.experiments.hasCheckpoints()
  }

  public getChildColumns(path?: string) {
    return this.columns.getChildren(path)
  }

  public toggleColumnStatus(path: string) {
    const status = this.columns.toggleStatus(path)

    this.notifyColumnsChanged()

    return status
  }

  public getColumnsStatuses() {
    return this.columns.getTerminalNodeStatuses()
  }

  public toggleExperimentStatus(
    id: string
  ): Color | typeof UNSELECTED | undefined {
    const selected = this.experiments.isSelected(id)
    if (!selected && !this.experiments.canSelect()) {
      return
    }

    const status = this.experiments.toggleStatus(id)
    this.notifyChanged()
    return status
  }

  public checkForFinishedWorkspaceExperiment(
    fetchedExperiments: FetchedExperiment[]
  ) {
    if (!hasFinishedWorkspaceExperiment(fetchedExperiments)) {
      return
    }

    this.experiments.unselectWorkspace()
    this.notifyChanged()
  }

  public getSorts() {
    return this.experiments.getSorts()
  }

  public getScale() {
    const acc = createTypedAccumulator(ExperimentsScale)

    for (const { type } of this.columns.getTerminalNodes()) {
      if (type in acc) {
        acc[<keyof typeof acc>type] = acc[<keyof typeof acc>type] + 1
      }
    }
    const checkpointType = this.hasCheckpoints()
      ? ExperimentsScale.HAS_CHECKPOINTS
      : ExperimentsScale.NO_CHECKPOINTS
    acc[checkpointType] = acc[checkpointType] + 1
    return acc
  }

  public async addSort() {
    const columns = this.columns.getTerminalNodes()
    const columnLikes = addStarredToColumns(columns)

    const sortToAdd = await pickSortToAdd(columnLikes)
    if (!sortToAdd) {
      return
    }
    this.experiments.addSort(sortToAdd)
    return this.notifyChanged()
  }

  public addStarredSort() {
    this.experiments.addSort(starredSort)
    return this.notifyChanged()
  }

  public removeSort(pathToRemove: string) {
    this.experiments.removeSort(pathToRemove)
    return this.notifyChanged()
  }

  public async removeSorts() {
    const sorts = this.experiments.getSorts()
    const sortsToRemove = await pickSortsToRemove(sorts)
    if (!sortsToRemove) {
      return
    }
    this.experiments.removeSorts(sortsToRemove)
    return this.notifyChanged()
  }

  public getFilters() {
    return this.experiments.getFilters()
  }

  public async addFilter() {
    const columns = this.columns.getTerminalNodes()
    const columnLikes = addStarredToColumns(columns)

    const filterToAdd = await pickFilterToAdd(columnLikes)
    if (!filterToAdd) {
      return
    }

    this.experiments.addFilter(filterToAdd)
    return this.notifyChanged()
  }

  public addStarredFilter() {
    this.experiments.addFilter(starredFilter)
    return this.notifyChanged()
  }

  public removeFilter(id: string) {
    if (this.experiments.removeFilter(id)) {
      return this.notifyChanged()
    }
  }

  public async removeFilters() {
    const filters = this.experiments.getFilters()
    const filterIdsToRemove = await pickFiltersToRemove(filters)
    if (!filterIdsToRemove) {
      return
    }

    this.experiments.removeFilters(filterIdsToRemove)
    return this.notifyChanged()
  }

  public getFilteredCount() {
    return this.experiments.getFilteredCount()
  }

  public getExperimentCount() {
    if (!this.columns.hasNonDefaultColumns()) {
      return 0
    }

    return this.experiments.getExperimentCount()
  }

  public getWorkspaceCommitsAndExperiments() {
    return this.experiments.getWorkspaceCommitsAndExperiments()
  }

  public async selectExperimentsToPlot() {
    const experiments = this.experiments
      .getWorkspaceCommitsAndExperiments()
      .filter(({ status }) => !isRunning(status))

    const selected = await pickExperimentsToPlot(
      experiments,
      this.columns.getFirstThreeColumnOrder()
    )
    if (!selected) {
      return
    }

    this.experiments.setSelected(selected)
    return this.notifyChanged()
  }

  public async selectColumns() {
    const columns = this.columns.getTerminalNodes()

    const selected = await pickPaths('columns', columns)
    if (!selected) {
      return
    }

    this.columns.setSelected(selected)
    return this.notifyChanged()
  }

  public pickCommitOrExperiment() {
    return pickExperiment(
      this.experiments.getCommitsAndExperiments(),
      this.getFirstThreeColumnOrder()
    )
  }

  public pickRunningExperiments() {
    return pickExperiments(
      this.experiments.getRunningExperiments(),
      this.getFirstThreeColumnOrder(),
      Title.SELECT_EXPERIMENTS_STOP
    )
  }

  public pickExperimentsToRemove() {
    return pickExperiments(
      this.experiments.getExperimentsAndQueued(),
      this.getFirstThreeColumnOrder(),
      Title.SELECT_EXPERIMENTS_REMOVE
    )
  }

  public pickExperimentsToPush() {
    return pickExperiments(
      this.experiments.getExperiments(),
      this.getFirstThreeColumnOrder(),
      Title.SELECT_EXPERIMENTS_PUSH
    )
  }

  public async pickAndModifyParams(overrideId?: string) {
    const id = await this.getExperimentId(overrideId)
    if (!id) {
      return
    }

    const params = this.experiments.getExperimentParams(id)

    if (!params) {
      return
    }

    return pickAndModifyParams(params)
  }

  public getWorkspaceAndCommits() {
    if (!this.columns.hasNonDefaultColumns()) {
      return []
    }

    return this.experiments.getWorkspaceAndCommits()
  }

  public getCommitExperiments(commit: Experiment) {
    return this.experiments.getExperimentsByCommitForTree(commit)
  }

  public getSelectedRevisions() {
    if (!this.columns.hasNonDefaultColumns()) {
      return []
    }

    return this.experiments.getSelectedRevisions()
  }

  public setRevisionCollected(revisions: string[]) {
    this.experiments.setRevisionCollected(revisions)
  }

  public getFinishedExperiments() {
    return this.experiments.getFinishedExperiments()
  }

  public getExperiments() {
    return this.experiments.getExperiments()
  }

  public getRevisionIds() {
    return this.experiments.getRevisionIds()
  }

  public async modifyExperimentParamsAndRun(
    commandId: ModifiedExperimentAndRunCommandId,
    experimentId?: string
  ) {
    const paramsToModify = await this.pickAndModifyParams(experimentId)
    if (!paramsToModify) {
      return
    }

    await this.internalCommands.executeCommand<string>(
      commandId,
      this.dvcRoot,
      ...paramsToModify
    )
    return this.notifyChanged()
  }

  public async modifyExperimentParamsAndQueue(experimentId?: string) {
    const paramsToModify = await this.pickAndModifyParams(experimentId)
    if (!paramsToModify) {
      return
    }

    await Toast.showOutput(
      this.internalCommands.executeCommand<string>(
        AvailableCommands.EXP_QUEUE,
        this.dvcRoot,
        ...paramsToModify
      )
    )
    return this.notifyChanged()
  }

  public stopExperiments(ids: string[]) {
    const { runningInQueueIds, runningInWorkspaceId } =
      this.experiments.getStopDetails(ids)

    const promises: Promise<string | void>[] = []

    if (runningInQueueIds) {
      promises.push(
        this.internalCommands.executeCommand(
          AvailableCommands.QUEUE_KILL,
          this.dvcRoot,
          ...runningInQueueIds
        )
      )
    }
    if (runningInWorkspaceId) {
      promises.push(stopWorkspaceExperiment(this.dvcRoot, runningInWorkspaceId))
    }

    return Toast.showOutput(
      Promise.all(promises).then(output => output.filter(Boolean).join('\n'))
    )
  }

  public hasRunningExperiment() {
    return this.experiments.hasRunningExperiment()
  }

  public hasRunningWorkspaceExperiment() {
    return this.experiments.hasRunningWorkspaceExperiment()
  }

  public getFirstThreeColumnOrder() {
    return this.columns.getFirstThreeColumnOrder()
  }

  public getColumnTerminalNodes() {
    return this.columns.getTerminalNodes()
  }

  public getHasData() {
    if (this.deferred.state === 'none') {
      return
    }
    return this.columns.hasNonDefaultColumns()
  }

  public getRelativeMetricsFiles() {
    return this.columns.getRelativeMetricsFiles()
  }

  protected sendInitialWebviewData() {
    return this.webviewMessages.sendWebviewMessage()
  }

  private setupInitialData() {
    const waitForInitialData = this.dispose.track(
      this.onDidChangeExperiments(() => {
        this.deferred.resolve()
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
      })
    )
  }

  private notifyChanged() {
    this.decorationProvider.setState(
      this.experiments.getLabels(),
      this.experiments.getLabelsToDecorate(),
      this.experiments.getErrors()
    )
    this.experimentsChanged.fire()
    this.notifyColumnsChanged()
  }

  private notifyColumnsChanged() {
    this.columnsChanged.fire()
    return this.webviewMessages.sendWebviewMessage()
  }

  private getCommitOutput(data: ExpShowOutput | undefined) {
    if (!(data && data.length > 1)) {
      return
    }
    const [lastCommit] = data.slice(-1)
    return this.internalCommands.executeCommand(
      AvailableCommands.GIT_GET_COMMIT_MESSAGES,
      this.dvcRoot,
      lastCommit.rev
    )
  }

  private createWebviewMessageHandler() {
    const webviewMessages = new WebviewMessages(
      this.dvcRoot,
      this.experiments,
      this.columns,
      () => this.getWebview(),
      () => this.notifyChanged(),
      () => this.selectColumns(),
      () =>
        this.internalCommands.executeCommand(
          AvailableCommands.STAGE_LIST,
          this.dvcRoot
        ),
      () => this.addStage(),
      (branchesSelected: string[]) => this.selectBranches(branchesSelected),
      () =>
        this.internalCommands.executeCommand<number>(
          AvailableCommands.GIT_GET_NUM_COMMITS,
          this.dvcRoot
        ),
      () => this.data.update()
    )

    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        this.webviewMessages.handleMessageFromWebview(message)
      )
    )

    return webviewMessages
  }

  private async getExperimentId(overrideId?: string) {
    if (overrideId) {
      return overrideId
    }

    return await pickExperiment(
      this.experiments.getCombinedList(),
      this.getFirstThreeColumnOrder(),
      Title.SELECT_BASE_EXPERIMENT
    )
  }

  private watchActiveEditor() {
    setContextForEditorTitleIcons(
      this.dvcRoot,
      this.dispose,
      () => this.columns.getParamsFiles(),
      this.paramsFileFocused,
      this.onDidChangeColumns
    )
  }

  private async checkSignalFile() {
    const dvcLiveOnly = await checkSignalFile(this.dvcLiveOnlySignalFile)

    if (dvcLiveOnly && !this.dvcLiveOnlyCleanupInitialized) {
      this.dvcLiveOnlyCleanupInitialized = true
      void pollSignalFileForProcess(this.dvcLiveOnlySignalFile, () => {
        this.dvcLiveOnlyCleanupInitialized = false
        if (this.hasRunningWorkspaceExperiment()) {
          void this.data.update()
        }
      })
    }
    return dvcLiveOnly
  }
}
