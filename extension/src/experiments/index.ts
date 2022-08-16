import { Event, EventEmitter, Memento } from 'vscode'
import { addStarredToColumns } from './columns/like'
import { setContextForEditorTitleIcons } from './context'
import { ExperimentsModel } from './model'
import { pickExperiments } from './model/quickPicks'
import { pickAndModifyParams } from './model/modify/quickPick'
import { pickExperiment } from './quickPick'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { tooManySelected } from './model/status'
import { starredSort } from './model/sortBy/constants'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { ColumnsModel } from './columns/model'
import { CheckpointsModel } from './checkpoints/model'
import { ExperimentsData } from './data'
import { askToDisableAutoApplyFilters } from './toast'
import { Experiment, ColumnType, TableData } from './webview/contract'
import { WebviewMessages } from './webview/messages'
import { DecorationProvider } from './model/decorationProvider'
import { starredFilter } from './model/filterBy/constants'
import { ResourceLocator } from '../resourceLocator'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { ExperimentsOutput } from '../cli/reader'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { FileSystemData } from '../fileSystem/data'
import { Response } from '../vscode/response'
import { Title } from '../vscode/title'
import { createTypedAccumulator } from '../util/object'
import { pickPaths } from '../path/selection/quickPick'
import { Toast } from '../vscode/toast'

export const ExperimentsScale = {
  ...ColumnType,
  HAS_CHECKPOINTS: 'hasCheckpoints',
  NO_CHECKPOINTS: 'noCheckpoints'
} as const

export type ModifiedExperimentAndRunCommandId =
  | typeof AvailableCommands.EXPERIMENT_RUN
  | typeof AvailableCommands.EXPERIMENT_RESET_AND_RUN

export class Experiments extends BaseRepository<TableData> {
  public readonly onDidChangeIsParamsFileFocused: Event<string | undefined>
  public readonly onDidChangeExperiments: Event<ExperimentsOutput | void>
  public readonly onDidChangeColumns: Event<void>
  public readonly onDidChangeCheckpoints: Event<void>

  public readonly viewKey = ViewKey.EXPERIMENTS

  private readonly cliData: ExperimentsData
  private readonly fileSystemData: FileSystemData

  private readonly experiments: ExperimentsModel
  private readonly columns: ColumnsModel
  private readonly checkpoints: CheckpointsModel

  private readonly paramsFileFocused = this.dispose.track(
    new EventEmitter<string | undefined>()
  )

  private readonly experimentsChanged = this.dispose.track(
    new EventEmitter<ExperimentsOutput | void>()
  )

  private readonly checkpointsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly columnsChanged = this.dispose.track(new EventEmitter<void>())
  private readonly decorationProvider = this.dispose.track(
    new DecorationProvider()
  )

  private readonly internalCommands: InternalCommands
  private readonly webviewMessages: WebviewMessages

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    resourceLocator: ResourceLocator,
    workspaceState: Memento,
    cliData?: ExperimentsData,
    fileSystemData?: FileSystemData
  ) {
    super(dvcRoot, resourceLocator.beaker)

    this.internalCommands = internalCommands

    this.onDidChangeIsParamsFileFocused = this.paramsFileFocused.event
    this.onDidChangeExperiments = this.experimentsChanged.event
    this.onDidChangeColumns = this.columnsChanged.event
    this.onDidChangeCheckpoints = this.checkpointsChanged.event

    this.experiments = this.dispose.track(
      new ExperimentsModel(dvcRoot, workspaceState)
    )

    this.columns = this.dispose.track(new ColumnsModel(dvcRoot, workspaceState))

    this.checkpoints = this.dispose.track(new CheckpointsModel())

    this.cliData = this.dispose.track(
      cliData || new ExperimentsData(dvcRoot, internalCommands, updatesPaused)
    )

    this.fileSystemData = this.dispose.track(
      fileSystemData || new FileSystemData(dvcRoot)
    )

    this.dispose.track(this.cliData.onDidUpdate(data => this.setState(data)))
    this.dispose.track(
      this.fileSystemData.onDidUpdate(data => {
        const hadCheckpoints = this.hasCheckpoints()
        this.checkpoints.transformAndSet(data)
        if (hadCheckpoints !== this.hasCheckpoints()) {
          this.checkpointsChanged.fire()
        }
      })
    )

    this.webviewMessages = this.createWebviewMessageHandler()
    this.setupInitialData()
    this.watchActiveEditor()
  }

  public update() {
    return this.cliData.managedUpdate()
  }

  public forceUpdate() {
    return this.cliData.forceUpdate()
  }

  public async setState(data: ExperimentsOutput) {
    await Promise.all([
      this.columns.transformAndSet(data),
      this.experiments.transformAndSet(data)
    ])

    return this.notifyChanged(data)
  }

  public hasCheckpoints() {
    return this.checkpoints.hasCheckpoints()
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

  public toggleExperimentStatus(id: string) {
    const selected = this.experiments.isSelected(id)
    if (!selected && !this.experiments.canSelect()) {
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
      acc[type] = acc[type] + 1
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

  public async removeFilter(id: string) {
    const response = await this.checkAutoApplyFilters(id)
    if (response === Response.CANCEL) {
      return
    }

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

    const response = await this.checkAutoApplyFilters(...filterIdsToRemove)
    if (response === Response.CANCEL) {
      return
    }

    this.experiments.removeFilters(filterIdsToRemove)
    return this.notifyChanged()
  }

  public getFilteredCounts() {
    return this.experiments.getFilteredCounts(this.hasCheckpoints())
  }

  public getExperimentCount() {
    if (!this.columns.hasColumns()) {
      return 0
    }

    return this.experiments.getExperimentCount()
  }

  public async selectExperiments() {
    const experiments = this.experiments.getExperimentsWithCheckpoints()

    const selected = await pickExperiments(experiments, this.hasCheckpoints())
    if (!selected) {
      return
    }

    this.experiments.setSelectionMode(false)
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

  public async autoApplyFilters(useFilters: boolean) {
    this.experiments.setSelectionMode(useFilters)

    if (useFilters) {
      const filteredExperiments = this.experiments
        .getUnfilteredExperiments()
        .filter(exp => !exp.queued)
      if (tooManySelected(filteredExperiments)) {
        await this.warnAndDoNotAutoApply(filteredExperiments)
      } else {
        this.experiments.setSelected(filteredExperiments)
      }
      return this.notifyChanged()
    }
  }

  public pickCurrentExperiment() {
    return pickExperiment(this.experiments.getCurrentExperiments())
  }

  public pickQueuedExperiment() {
    return pickExperiment(this.experiments.getQueuedExperiments())
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

  public getExperiments() {
    if (!this.columns.hasColumns()) {
      return []
    }

    return this.experiments.getExperiments()
  }

  public getCheckpoints(id: string) {
    return this.experiments.getCheckpointsWithType(id)
  }

  public sendInitialWebviewData() {
    return this.webviewMessages.sendWebviewMessage()
  }

  public getSelectedRevisions() {
    if (!this.columns.hasColumns()) {
      return []
    }

    return this.experiments.getSelectedRevisions()
  }

  public getBranchRevisions() {
    return this.experiments.getBranchRevisions()
  }

  public getExperimentDisplayName(experimentId: string) {
    const experiment = this.experiments
      .getCombinedList()
      .find(({ id }) => id === experimentId)
    return experiment?.name || experiment?.label
  }

  public getMutableRevisions() {
    return this.experiments.getMutableRevisions(
      this.checkpoints.hasCheckpoints()
    )
  }

  public getRevisions() {
    return this.experiments.getRevisions()
  }

  public getSelectedExperiments() {
    return this.experiments.getSelectedExperiments()
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
        AvailableCommands.EXPERIMENT_QUEUE,
        this.dvcRoot,
        ...paramsToModify
      )
    )
    return this.notifyChanged()
  }

  public hasRunningExperiment() {
    return this.experiments.hasRunningExperiment()
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

  private notifyChanged(data?: ExperimentsOutput) {
    this.decorationProvider.setState(
      this.experiments.getLabels(),
      this.experiments.getLabelsToDecorate(),
      this.experiments.getErrors()
    )
    this.experimentsChanged.fire(data)
    this.notifyColumnsChanged()
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
      this.checkpoints,
      () => this.getWebview(),
      () => this.notifyChanged(),
      () => this.selectColumns()
    )

    this.dispose.track(
      this.onDidReceivedWebviewMessage(message =>
        this.webviewMessages.handleMessageFromWebview(message)
      )
    )

    return webviewMessages
  }

  private async checkAutoApplyFilters(...filterIdsToRemove: string[]) {
    if (this.experiments.canAutoApplyFilters(...filterIdsToRemove)) {
      return
    }

    const response = await askToDisableAutoApplyFilters(
      'Auto apply filters to experiment selection is currently active. Too many experiments would be selected by removing the selected filter(s), how would you like to proceed?',
      Response.TURN_OFF
    )
    if (response !== Response.CANCEL) {
      this.autoApplyFilters(false)
    }
    return response
  }

  private async warnAndDoNotAutoApply(filteredExperiments: Experiment[]) {
    this.experiments.setSelectionMode(false)

    const response = await askToDisableAutoApplyFilters(
      'Too many experiments would be selected by applying the current filter(s), how would you like to proceed?',
      Response.SELECT_MOST_RECENT
    )

    if (response === Response.SELECT_MOST_RECENT) {
      this.experiments.setSelected(filteredExperiments)
    }
  }

  private async getExperimentId(overrideId?: string) {
    if (overrideId) {
      return overrideId
    }

    const experiment = await pickExperiment(
      this.experiments.getExperiments(),
      Title.SELECT_BASE_EXPERIMENT
    )

    return experiment?.id
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
}
