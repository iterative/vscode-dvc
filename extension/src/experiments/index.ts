import { join } from 'path'
import {
  ConfigurationChangeEvent,
  Event,
  EventEmitter,
  Memento,
  workspace
} from 'vscode'
import omit from 'lodash.omit'
import { ColumnLike, addStarredToColumns } from './columns/like'
import { setContextForEditorTitleIcons } from './context'
import { ExperimentsModel } from './model'
import { collectRemoteExpShas } from './model/collect'
import {
  pickExperiment,
  pickExperiments,
  pickExperimentsToPlot
} from './model/quickPick'
import { pickAndModifyParams } from './model/modify/quickPick'
import {
  pickColumnToFilter,
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { Color } from './model/status/colors'
import { MAX_SELECTED_EXPERIMENTS, UNSELECTED } from './model/status'
import { starredSort } from './model/sortBy/constants'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { ColumnsModel } from './columns/model'
import { ExperimentsData } from './data'
import { stopWorkspaceExperiment } from './processExecution'
import { Studio } from './studio'
import { Experiment, ColumnType, TableData, Column } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { DecorationProvider } from './model/decorationProvider'
import { starredFilter } from './model/filterBy/constants'
import { ResourceLocator } from '../resourceLocator'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import {
  ExperimentsOutput,
  isRemoteExperimentsOutput,
  isStudioExperimentsOutput
} from '../data'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { Title } from '../vscode/title'
import { createTypedAccumulator } from '../util/object'
import { pickPaths } from '../path/selection/quickPick'
import { Toast } from '../vscode/toast'
import { ConfigKey, getConfigValue, setUserConfigValue } from '../vscode/config'
import {
  checkSignalFile,
  getEntryFromJsonFile,
  pollSignalFileForProcess
} from '../fileSystem'
import { DVCLIVE_ONLY_RUNNING_SIGNAL_FILE } from '../cli/dvc/constants'
import { Response } from '../vscode/response'
import { Pipeline } from '../pipeline'
import { definedAndNonEmpty } from '../util/array'

export const ExperimentsScale = {
  ...omit(ColumnType, 'TIMESTAMP'),
  HAS_CHECKPOINTS: 'hasCheckpoints',
  NO_CHECKPOINTS: 'noCheckpoints'
} as const

export type ModifiedExperimentAndRunCommandId =
  | typeof AvailableCommands.EXPERIMENT_RUN
  | typeof AvailableCommands.EXPERIMENT_RESET_AND_RUN

export class Experiments extends BaseRepository<TableData> {
  public readonly onDidChangeIsExperimentsFileFocused: Event<string | undefined>
  public readonly onDidChangeExperiments: Event<void>
  public readonly onDidChangeColumns: Event<void>
  public readonly onDidChangeColumnOrderOrStatus: Event<void>
  public readonly onDidChangeCheckpoints: Event<void>

  public readonly viewKey = ViewKey.EXPERIMENTS

  private readonly pipeline: Pipeline

  private readonly data: ExperimentsData
  private readonly experiments: ExperimentsModel
  private readonly columns: ColumnsModel
  private readonly studio: Studio

  private readonly experimentsFileFocused = this.dispose.track(
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

  private readonly selectBranches: (
    branchesSelected: string[]
  ) => Promise<string[] | undefined>

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    pipeline: Pipeline,
    resourceLocator: ResourceLocator,
    workspaceState: Memento,
    selectBranches: (
      branchesSelected: string[]
    ) => Promise<string[] | undefined>,
    subProjects: string[],
    data?: ExperimentsData
  ) {
    super(dvcRoot, resourceLocator.beaker)

    this.dvcLiveOnlySignalFile = join(
      this.dvcRoot,
      DVCLIVE_ONLY_RUNNING_SIGNAL_FILE
    )

    this.internalCommands = internalCommands
    this.pipeline = pipeline
    this.selectBranches = selectBranches

    this.onDidChangeIsExperimentsFileFocused = this.experimentsFileFocused.event
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

    this.studio = this.dispose.track(new Studio(this.dvcRoot, internalCommands))

    this.data = this.dispose.track(
      data ||
        new ExperimentsData(
          dvcRoot,
          internalCommands,
          this.experiments,
          this.studio,
          subProjects
        )
    )

    this.dispose.track(this.data.onDidUpdate(data => this.setState(data)))

    this.dispose.track(
      workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
        if (event.affectsConfiguration(ConfigKey.EXP_TABLE_HEAD_MAX_HEIGHT)) {
          void this.refresh()
        }
      })
    )

    this.webviewMessages = this.createWebviewMessageHandler()
    this.setupInitialData()
    this.watchActiveEditor(subProjects)
  }

  public update() {
    return this.data.managedUpdate()
  }

  public async setState(data: ExperimentsOutput) {
    if (isRemoteExperimentsOutput(data)) {
      const { lsRemoteOutput } = data
      this.experiments.transformAndSetRemote(lsRemoteOutput)
      return this.webviewMessages.sendWebviewMessage()
    }

    if (isStudioExperimentsOutput(data)) {
      const { live, pushed, baseUrl } = data
      this.studio.setBaseUrl(baseUrl)
      this.experiments.setStudioData(live, pushed)
      return this.webviewMessages.sendWebviewMessage()
    }

    const { expShow, gitLog, rowOrder, availableNbCommits } = data

    const hadCheckpoints = this.hasCheckpoints()
    const dvcLiveOnly = await this.checkSignalFile()
    await Promise.all([
      this.columns.transformAndSet(expShow),
      this.experiments.transformAndSetLocal(
        expShow,
        gitLog,
        dvcLiveOnly,
        rowOrder,
        availableNbCommits
      )
    ])

    if (hadCheckpoints !== this.hasCheckpoints()) {
      this.checkpointsChanged.fire()
    }

    return this.notifyChanged()
  }

  public setPushing(ids: string[]) {
    this.experiments.setPushing(ids)
    return this.notifyChanged()
  }

  public async unsetPushing(ids: string[]) {
    await Promise.all([this.update(), this.patchStudioApiTimingIssue(ids)])

    this.experiments.unsetPushing(ids)
    return this.webviewMessages.sendWebviewMessage()
  }

  public hasCheckpoints() {
    return this.experiments.hasCheckpoints()
  }

  public getChildColumns(path?: string) {
    return this.columns.getChildren(path)
  }

  public toggleColumnStatus(path: string) {
    const status = this.columns.toggleStatus(path)

    void this.notifyColumnsChanged()

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
      void this.informMaxSelected()
      return
    }

    const status = this.experiments.toggleStatus(id)
    this.notifyChanged()
    return status
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

  public async addFilter(overrideColumn?: ColumnLike) {
    const column = await this.pickColumnToFilter(overrideColumn)
    if (!column) {
      return
    }

    const filterToAdd = await pickFilterToAdd(column)
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

  public getRecordCount() {
    return this.experiments.getRecordCount()
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
    const experiments = this.experiments.getWorkspaceCommitsAndExperiments()

    const selected = await pickExperimentsToPlot(
      experiments,
      this.columns.getSummaryColumnOrder()
    )
    if (!selected) {
      return
    }

    this.experiments.setSelected(selected)
    return this.notifyChanged()
  }

  public async selectColumns() {
    const columns = this.columns.getTerminalNodes()

    const selected = await pickPaths(columns, Title.SELECT_COLUMNS)
    if (!selected) {
      return
    }

    this.columns.setSelected(selected)
    return this.notifyChanged()
  }

  public async selectFirstColumns() {
    const columns = this.columns.getTerminalNodes()

    const selected = await pickPaths<Column>(
      columns,
      Title.SELECT_FIRST_COLUMNS,
      element => ({
        description: element.selected ? '$(eye)' : '$(eye-closed)',
        label: element.path,
        picked: false,
        value: element
      })
    )
    if (!definedAndNonEmpty(selected)) {
      return
    }

    this.columns.selectFirst(selected.map(({ path }) => path))
    return this.notifyChanged()
  }

  public pickCommitOrExperiment() {
    return pickExperiment(
      this.experiments.getCommitsAndExperiments(),
      this.getSummaryColumnOrder()
    )
  }

  public pickRunningExperiments() {
    return pickExperiments(
      this.experiments.getRunningExperiments(),
      this.getSummaryColumnOrder(),
      Title.SELECT_EXPERIMENTS_STOP
    )
  }

  public pickExperimentsToRemove() {
    return pickExperiments(
      this.experiments.getExperimentsAndQueued(),
      this.getSummaryColumnOrder(),
      Title.SELECT_EXPERIMENTS_REMOVE
    )
  }

  public pickExperimentsToPush() {
    return pickExperiments(
      this.experiments.getExperiments(),
      this.getSummaryColumnOrder(),
      Title.SELECT_EXPERIMENTS_PUSH
    )
  }

  public pickAndModifyParams(inputPrompt?: string) {
    const params = this.experiments.getWorkspaceParams()

    if (!params) {
      return
    }

    return pickAndModifyParams(params, inputPrompt)
  }

  public getWorkspaceAndCommits() {
    if (
      !this.experiments.getCliError() &&
      !this.columns.hasNonDefaultColumns()
    ) {
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

  public getExperiments() {
    return this.experiments.getExperiments()
  }

  public getRevisionIds() {
    return this.experiments.getRevisionIds()
  }

  public async modifyWorkspaceParamsAndRun(
    commandId: ModifiedExperimentAndRunCommandId
  ) {
    const cwd = await this.getPipelineCwd()
    if (!cwd) {
      return
    }

    const paramsToModify = await this.pickAndModifyParams()
    if (!paramsToModify) {
      return
    }

    await this.internalCommands.executeCommand<string>(
      commandId,
      cwd,
      ...paramsToModify
    )
    return this.notifyChanged()
  }

  public async modifyWorkspaceParamsAndQueue() {
    const cwd = await this.getPipelineCwd()
    if (!cwd) {
      return
    }

    const paramsToModify = await this.pickAndModifyParams(
      'Use range(start,stop,step) or choice(*choices) to add multiple experiments to the queue'
    )
    if (!paramsToModify) {
      return
    }

    await Toast.showOutput(
      this.internalCommands.executeCommand<string>(
        AvailableCommands.EXP_QUEUE,
        cwd,
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

  public getCliError() {
    return this.experiments.getCliError()
  }

  public getSummaryColumnOrder() {
    return this.columns.getSummaryColumnOrder()
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

  public getPipelineCwd() {
    return this.pipeline.getCwd()
  }

  public getAvailableBranchesToSelect() {
    return this.experiments.getAvailableBranchesToSelect()
  }

  public refresh() {
    return this.data.update()
  }

  public setStudioAccessToken(studioAccessToken: string | undefined) {
    const oldAccessToken = this.studio.getAccessToken()
    const accessTokenInitialized = this.studio.isAccessTokenSet()
    this.studio.setAccessToken(studioAccessToken)

    if (!accessTokenInitialized || oldAccessToken === studioAccessToken) {
      return
    }
    return this.data.managedUpdate()
  }

  public hasDvcLiveOnlyRunning() {
    return this.experiments.hasDvcLiveOnlyRunning()
  }

  public checkWorkspaceDuplicated(fetched: string[]) {
    const updated = this.experiments.checkWorkspaceDuplicated(fetched)
    if (!updated) {
      return
    }

    this.notifyChanged()
  }

  protected sendInitialWebviewData() {
    return this.webviewMessages.sendWebviewMessage()
  }

  private setupInitialData() {
    const waitForInitialData = this.dispose.track(
      this.onDidChangeExperiments(async () => {
        await Promise.all([this.data.isReady(), this.pipeline.isReady()])
        this.deferred.resolve()
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.dispose.track(
          this.pipeline.onDidUpdate(() =>
            this.webviewMessages.sendWebviewMessage()
          )
        )
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
    void this.notifyColumnsChanged()
  }

  private notifyColumnsChanged() {
    this.columnsChanged.fire()
    return this.webviewMessages.sendWebviewMessage()
  }

  private createWebviewMessageHandler() {
    const webviewMessages = new WebviewMessages(
      this.dvcRoot,
      this.experiments,
      this.columns,
      this.pipeline,
      this.studio,
      () => this.getWebview(),
      () => this.notifyChanged(),
      () => this.selectColumns(),
      () => this.selectFirstColumns(),
      (branchesSelected: string[]) => this.selectBranches(branchesSelected),
      (column: ColumnLike) => this.addFilter(column),
      () => this.refresh()
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
      this.getSummaryColumnOrder(),
      Title.SELECT_BASE_EXPERIMENT
    )
  }

  private watchActiveEditor(subProjects: string[]) {
    setContextForEditorTitleIcons(
      this.dvcRoot,
      this.dispose,
      () => this.columns.getParamsFiles(),
      this.experimentsFileFocused,
      this.onDidChangeColumns,
      subProjects
    )
  }

  private async checkSignalFile() {
    const running = await checkSignalFile(this.dvcLiveOnlySignalFile)

    if (!running) {
      return { running }
    }

    if (!this.dvcLiveOnlyCleanupInitialized) {
      this.dvcLiveOnlyCleanupInitialized = true
      void pollSignalFileForProcess(this.dvcLiveOnlySignalFile, () => {
        this.dvcLiveOnlyCleanupInitialized = false
        if (this.hasRunningWorkspaceExperiment()) {
          void this.refresh()
        }
      })
    }
    const expName = getEntryFromJsonFile(this.dvcLiveOnlySignalFile, 'exp_name')

    return { expName, running }
  }

  private async informMaxSelected() {
    if (getConfigValue(ConfigKey.DO_NOT_INFORM_MAX_PLOTTED, false)) {
      return
    }
    const response = await Toast.infoWithOptions(
      `Cannot plot more than ${MAX_SELECTED_EXPERIMENTS} experiments.`,
      Response.NEVER
    )

    if (response === Response.NEVER) {
      return setUserConfigValue(ConfigKey.DO_NOT_INFORM_MAX_PLOTTED, true)
    }
  }

  private pickColumnToFilter(overrideColumn?: ColumnLike) {
    if (overrideColumn) {
      return overrideColumn
    }
    const columns = this.columns.getTerminalNodes()
    const columnLikes = addStarredToColumns(columns)
    return pickColumnToFilter(columnLikes)
  }

  private async patchStudioApiTimingIssue(ids: string[]) {
    if (!this.studio.isConnected()) {
      return
    }

    const [, { lsRemoteOutput }] = await Promise.all([
      this.waitForStudioUpdate(),
      this.waitForRemoteUpdate()
    ])

    const remoteExpShas = collectRemoteExpShas(lsRemoteOutput)

    const shas = []
    for (const { id, sha } of this.experiments.getExperiments()) {
      if (ids.includes(id) && sha && remoteExpShas.has(sha)) {
        shas.push(sha)
      }
    }

    this.experiments.assumePushed(shas)
  }

  private waitForStudioUpdate() {
    return new Promise(resolve => {
      const listener = this.dispose.track(
        this.data.onDidUpdate(data => {
          if (!isStudioExperimentsOutput(data)) {
            return
          }
          this.dispose.untrack(listener)
          listener.dispose()
          resolve(undefined)
        })
      )
    })
  }

  private waitForRemoteUpdate(): Promise<{ lsRemoteOutput: string }> {
    return new Promise(resolve => {
      const listener = this.dispose.track(
        this.data.onDidUpdate(data => {
          if (!isRemoteExperimentsOutput(data)) {
            return
          }
          this.dispose.untrack(listener)
          listener.dispose()
          resolve(data)
        })
      )
    })
  }
}
