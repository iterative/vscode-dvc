import { join } from 'path'
import {
  commands,
  Event,
  EventEmitter,
  Memento,
  Uri,
  ViewColumn,
  window
} from 'vscode'
import { ExperimentsModel } from './model'
import { pickExperiments } from './model/quickPicks'
import { pickAndModifyParams } from './model/modify/quickPick'
import { pickExperiment } from './quickPick'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { tooManySelected } from './model/status'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { ColumnsModel } from './columns/model'
import { CheckpointsModel } from './checkpoints/model'
import { ExperimentsData } from './data'
import { askToDisableAutoApplyFilters } from './toast'
import { Experiment, ColumnType, TableData } from './webview/contract'
import { DecorationProvider } from './model/filterBy/decorationProvider'
import { SortDefinition } from './model/sortBy'
import { splitColumnPath } from './columns/paths'
import { ResourceLocator } from '../resourceLocator'
import {
  AvailableCommands,
  CliCommandFromWebviewId,
  InternalCommands
} from '../commands/internal'
import { Args } from '../cli/constants'
import { ExperimentsOutput } from '../cli/reader'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { MessageFromWebviewType } from '../webview/contract'
import { Logger } from '../common/logger'
import { FileSystemData } from '../fileSystem/data'
import { Response } from '../vscode/response'
import { Title } from '../vscode/title'
import { sendTelemetryEvent } from '../telemetry'
import { EventName } from '../telemetry/constants'
import { getInput } from '../vscode/inputBox'
import { createTypedAccumulator } from '../util/object'
import { setContextValue } from '../vscode/context'
import { standardizePath } from '../fileSystem/path'
import { pickPaths } from '../path/selection/quickPick'
import { Toast } from '../vscode/toast'

export const ExperimentsScale = {
  ...ColumnType,
  HAS_CHECKPOINTS: 'hasCheckpoints',
  NO_CHECKPOINTS: 'noCheckpoints'
} as const

export type ModifiedExperimentCommandId =
  | typeof AvailableCommands.EXPERIMENT_QUEUE
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

    this.handleMessageFromWebview()
    this.setupInitialData()
    this.setActiveEditorContext()
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
    const sortToAdd = await pickSortToAdd(columns)
    if (!sortToAdd) {
      return
    }
    this.experiments.addSort(sortToAdd)
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
    const filterToAdd = await pickFilterToAdd(columns)
    if (!filterToAdd) {
      return
    }
    this.experiments.addFilter(filterToAdd)
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
    return this.experiments.getCheckpoints(id)
  }

  public sendInitialWebviewData() {
    return this.sendWebviewData()
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

  public async modifyExperimentParamsAndExecute(
    commandId: ModifiedExperimentCommandId,
    experimentId?: string
  ) {
    const paramsToModify = await this.pickAndModifyParams(experimentId)
    if (!paramsToModify) {
      return
    }

    const promise = this.internalCommands.executeCommand<string>(
      commandId,
      this.dvcRoot,
      ...paramsToModify
    )
    if (commandId === AvailableCommands.EXPERIMENT_QUEUE) {
      Toast.showOutput(promise)
    }
    return promise
  }

  public hasRunningExperiment() {
    return this.experiments.hasRunningExperiment()
  }

  private focusSortsTree() {
    const commandPromise = commands.executeCommand(
      'dvc.views.experimentsSortByTree.focus'
    )
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_SORTS_TREE,
      undefined,
      undefined
    )
    return commandPromise
  }

  private focusFiltersTree() {
    const commandPromise = commands.executeCommand(
      'dvc.views.experimentsFilterByTree.focus'
    )
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_FILTERS_TREE,
      undefined,
      undefined
    )
    return commandPromise
  }

  private hideTableColumn(path: string) {
    this.toggleColumnStatus(path)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_HIDE_COLUMN,
      { path },
      undefined
    )
  }

  private async openParamsFileToTheSide(path: string) {
    const [, fileSegment] = splitColumnPath(path)
    await window.showTextDocument(Uri.file(join(this.dvcRoot, fileSegment)), {
      viewColumn: ViewColumn.Beside
    })
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_OPEN_PARAMS_FILE,
      { path },
      undefined
    )
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

  private async executeCommandAndNotify(
    commandId: CliCommandFromWebviewId,
    ...args: Args
  ) {
    await this.internalCommands.executeCliFromWebview(
      commandId,
      this.dvcRoot,
      ...args
    )

    return this.notifyChanged()
  }

  private notifyChanged(data?: ExperimentsOutput) {
    this.decorationProvider.setState(
      this.experiments.getLabels(),
      this.experiments.getLabelsToDecorate()
    )
    this.experimentsChanged.fire(data)
    this.notifyColumnsChanged()
  }

  private notifyColumnsChanged() {
    this.columnsChanged.fire()
    return this.sendWebviewData()
  }

  private sendWebviewData() {
    this.webview?.show(this.getWebviewData())
  }

  private getWebviewData() {
    return {
      changes: this.columns.getChanges(),
      columnOrder: this.columns.getColumnOrder(),
      columnWidths: this.columns.getColumnWidths(),
      columns: this.columns.getSelected(),
      filteredCounts: this.getFilteredCounts(),
      filters: this.experiments.getFilterPaths(),
      hasCheckpoints: this.hasCheckpoints(),
      hasColumns: this.columns.hasColumns(),
      hasRunningExperiment: this.experiments.hasRunningExperiment(),
      rows: this.experiments.getRowData(),
      sorts: this.experiments.getSorts()
    }
  }

  private handleMessageFromWebview() {
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message => {
        switch (message.type) {
          case MessageFromWebviewType.REORDER_COLUMNS:
            return this.setColumnOrder(message.payload)
          case MessageFromWebviewType.RESIZE_COLUMN:
            return this.setColumnWidth(
              message.payload.id,
              message.payload.width
            )
          case MessageFromWebviewType.TOGGLE_EXPERIMENT:
            return this.setExperimentStatus(message.payload)
          case MessageFromWebviewType.HIDE_EXPERIMENTS_TABLE_COLUMN:
            return this.hideTableColumn(message.payload)
          case MessageFromWebviewType.OPEN_PARAMS_FILE_TO_THE_SIDE:
            return this.openParamsFileToTheSide(message.payload)
          case MessageFromWebviewType.SORT_COLUMN:
            return this.addColumnSort(message.payload)
          case MessageFromWebviewType.REMOVE_COLUMN_SORT:
            return this.removeColumnSort(message.payload)
          case MessageFromWebviewType.APPLY_EXPERIMENT_TO_WORKSPACE:
            return this.applyExperimentToWorkspace(message.payload)
          case MessageFromWebviewType.CREATE_BRANCH_FROM_EXPERIMENT:
            return this.createBranchFromExperiment(message.payload)
          case MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_QUEUE:
            return this.modifyExperimentParamsAndQueue(message.payload)
          case MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_AND_RUN:
            return this.modifyExperimentParamsAndRun(message.payload)
          case MessageFromWebviewType.VARY_EXPERIMENT_PARAMS_RESET_AND_RUN:
            return this.modifyExperimentParamsResetAndRun(message.payload)

          case MessageFromWebviewType.REMOVE_EXPERIMENT:
            return this.removeExperiment(message.payload)
          case MessageFromWebviewType.SELECT_COLUMNS:
            return this.setColumnsStatus()

          case MessageFromWebviewType.FOCUS_FILTERS_TREE:
            return this.focusFiltersTree()
          case MessageFromWebviewType.FOCUS_SORTS_TREE:
            return this.focusSortsTree()

          default:
            Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
        }
      })
    )
  }

  private setColumnOrder(order: string[]) {
    this.columns.setColumnOrder(order)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_COLUMNS_REORDERED,
      undefined,
      undefined
    )
  }

  private setColumnWidth(id: string, width: number) {
    this.columns.setColumnWidth(id, width)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_RESIZE_COLUMN,
      { width },
      undefined
    )
  }

  private setExperimentStatus(id: string) {
    this.toggleExperimentStatus(id)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_EXPERIMENT_TOGGLE,
      undefined,
      undefined
    )
  }

  private setColumnsStatus() {
    this.selectColumns()
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_SELECT_COLUMNS,
      undefined,
      undefined
    )
  }

  private addColumnSort(sort: SortDefinition) {
    this.experiments.addSort(sort)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_SORT_COLUMN,
      { ...sort },
      undefined
    )
    return this.notifyChanged()
  }

  private removeColumnSort(path: string) {
    this.experiments.removeSort(path)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_REMOVE_COLUMN_SORT,
      { path },
      undefined
    )
    return this.notifyChanged()
  }

  private async createBranchFromExperiment(experimentId: string) {
    const input = await getInput(Title.ENTER_BRANCH_NAME)
    if (!input) {
      return
    }
    return this.executeCommandAndNotify(
      AvailableCommands.EXPERIMENT_BRANCH,
      experimentId,
      input
    )
  }

  private applyExperimentToWorkspace(experimentId: string) {
    return this.executeCommandAndNotify(
      AvailableCommands.EXPERIMENT_APPLY,
      experimentId
    )
  }

  private removeExperiment(experimentId: string | string[]) {
    return this.executeCommandAndNotify(
      AvailableCommands.EXPERIMENT_REMOVE,
      ...[experimentId].flat()
    )
  }

  private async modifyExperimentParamsAndQueue(id: string) {
    await this.modifyExperimentParamsAndExecute(
      AvailableCommands.EXPERIMENT_QUEUE,
      id
    )

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_QUEUE,
      undefined,
      undefined
    )
  }

  private async modifyExperimentParamsAndRun(id: string) {
    await this.modifyExperimentParamsAndExecute(
      AvailableCommands.EXPERIMENT_RUN,
      id
    )

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_RUN,
      undefined,
      undefined
    )
  }

  private async modifyExperimentParamsResetAndRun(id: string) {
    await this.modifyExperimentParamsAndExecute(
      AvailableCommands.EXPERIMENT_RESET_AND_RUN,
      id
    )

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_RESET_AND_RUN,
      undefined,
      undefined
    )
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

  private setActiveEditorContext() {
    const setActiveEditorContext = (active: boolean) => {
      setContextValue('dvc.params.fileActive', active)
      const activeDvcRoot = active ? this.dvcRoot : undefined
      this.paramsFileFocused.fire(activeDvcRoot)
    }

    this.dispose.track(
      this.onDidChangeColumns(() => {
        const path = standardizePath(window.activeTextEditor?.document.fileName)
        if (!path) {
          return
        }

        if (!this.columns.getParamsFiles().has(path)) {
          return
        }
        setActiveEditorContext(true)
      })
    )

    this.dispose.track(
      window.onDidChangeActiveTextEditor(event => {
        const path = standardizePath(event?.document.fileName)
        if (!path) {
          setActiveEditorContext(false)
          return
        }

        if (path.includes(this.dvcRoot)) {
          if (this.columns.getParamsFiles().has(path)) {
            setActiveEditorContext(true)
            return
          }
          setActiveEditorContext(false)
        }
      })
    )
  }
}
