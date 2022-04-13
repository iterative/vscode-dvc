import { Event, EventEmitter, Memento } from 'vscode'
import { ExperimentsModel } from './model'
import { pickExperiments } from './model/quickPicks'
import { pickParamsToQueue } from './model/queue/quickPick'
import { pickExperiment } from './quickPick'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { tooManySelected } from './model/status'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { MetricsAndParamsModel } from './metricsAndParams/model'
import { CheckpointsModel } from './checkpoints/model'
import { ExperimentsData } from './data'
import { askToDisableAutoApplyFilters } from './toast'
import { Experiment, MetricOrParamType, TableData } from './webview/contract'
import { SortDefinition } from './model/sortBy'
import { ResourceLocator } from '../resourceLocator'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../commands/internal'
import { ExperimentsOutput } from '../cli/reader'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import { ContextMenuPayload, MessageFromWebviewType } from '../webview/contract'
import { Logger } from '../common/logger'
import { FileSystemData } from '../fileSystem/data'
import { Response } from '../vscode/response'
import { Title } from '../vscode/title'
import { QuickPickItemWithValue, quickPickValue } from '../vscode/quickPick'
import { sendTelemetryEvent } from '../telemetry'
import { EventName } from '../telemetry/constants'
import { Toast } from '../vscode/toast'
import { getInput } from '../vscode/inputBox'
import { createTypedAccumulator } from '../util/object'

export const ExperimentsScale = {
  ...MetricOrParamType,
  HAS_CHECKPOINTS: 'hasCheckpoints',
  NO_CHECKPOINTS: 'noCheckpoints'
} as const

export class Experiments extends BaseRepository<TableData> {
  public readonly onDidChangeExperiments: Event<ExperimentsOutput | void>
  public readonly onDidChangeMetricsOrParams: Event<void>

  public readonly viewKey = ViewKey.EXPERIMENTS

  private readonly cliData: ExperimentsData
  private readonly fileSystemData: FileSystemData

  private readonly experiments: ExperimentsModel
  private readonly metricsAndParams: MetricsAndParamsModel
  private readonly checkpoints: CheckpointsModel

  private readonly experimentsChanged = this.dispose.track(
    new EventEmitter<ExperimentsOutput | void>()
  )

  private readonly metricsOrParamsChanged = this.dispose.track(
    new EventEmitter<void>()
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

    this.onDidChangeExperiments = this.experimentsChanged.event
    this.onDidChangeMetricsOrParams = this.metricsOrParamsChanged.event

    this.experiments = this.dispose.track(
      new ExperimentsModel(dvcRoot, workspaceState)
    )

    this.metricsAndParams = this.dispose.track(
      new MetricsAndParamsModel(dvcRoot, workspaceState)
    )

    this.checkpoints = this.dispose.track(new CheckpointsModel())

    this.cliData = this.dispose.track(
      cliData || new ExperimentsData(dvcRoot, internalCommands, updatesPaused)
    )

    this.fileSystemData = this.dispose.track(
      fileSystemData || new FileSystemData(dvcRoot)
    )

    this.internalCommands = internalCommands

    this.dispose.track(this.cliData.onDidUpdate(data => this.setState(data)))
    this.dispose.track(
      this.fileSystemData.onDidUpdate(data =>
        this.checkpoints.transformAndSet(data)
      )
    )

    this.handleMessageFromWebview()

    const waitForInitialData = this.dispose.track(
      this.onDidChangeExperiments(() => {
        this.deferred.resolve()
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
      })
    )
  }

  public update() {
    return this.cliData.managedUpdate()
  }

  public forceUpdate() {
    return this.cliData.forceUpdate()
  }

  public async setState(data: ExperimentsOutput) {
    await Promise.all([
      this.metricsAndParams.transformAndSet(data),
      this.experiments.transformAndSet(data, this.hasCheckpoints())
    ])

    return this.notifyChanged(data)
  }

  public hasCheckpoints() {
    return this.checkpoints.hasCheckpoints()
  }

  public getChildMetricsOrParams(path?: string) {
    return this.metricsAndParams.getChildren(path)
  }

  public toggleMetricOrParamStatus(path: string) {
    const status = this.metricsAndParams.toggleStatus(path)

    this.notifyMetricsOrParamsChanged()

    return status
  }

  public getMetricsAndParamsStatuses() {
    return this.metricsAndParams.getTerminalNodeStatuses()
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

    for (const { type } of this.metricsAndParams.getTerminalNodes()) {
      acc[type] = acc[type] + 1
    }
    const checkpointType = this.hasCheckpoints()
      ? ExperimentsScale.HAS_CHECKPOINTS
      : ExperimentsScale.NO_CHECKPOINTS
    acc[checkpointType] = acc[checkpointType] + 1
    return acc
  }

  public async addSort() {
    const metricsAndParams = this.metricsAndParams.getTerminalNodes()
    const sortToAdd = await pickSortToAdd(metricsAndParams)
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
    const metricsAndParams = this.metricsAndParams.getTerminalNodes()
    const filterToAdd = await pickFilterToAdd(metricsAndParams)
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

  public async autoApplyFilters(useFilters: boolean) {
    this.experiments.setSelectionMode(useFilters)

    if (useFilters) {
      const filteredExperiments = this.experiments.getFilteredExperiments()
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

  public async pickParamsToQueue(overrideId?: string) {
    const id = await this.getExperimentId(overrideId)
    if (!id) {
      return
    }

    const params = this.experiments.getExperimentParams(id)

    if (!params) {
      return
    }

    return pickParamsToQueue(params)
  }

  public getExperiments() {
    return this.experiments.getExperiments()
  }

  public getCheckpoints(id: string) {
    return this.experiments.getCheckpoints(id)
  }

  public sendInitialWebviewData() {
    return this.sendWebviewData()
  }

  public getSelectedRevisions() {
    return this.experiments.getSelectedRevisions()
  }

  public getBranchRevisions() {
    return this.experiments.getBranchRevisions()
  }

  public getMutableRevisions() {
    return this.experiments.getMutableRevisions()
  }

  public getRevisions() {
    return this.experiments.getRevisions()
  }

  public getSelectedExperiments() {
    return this.experiments.getSelectedExperiments()
  }

  public runCommand(commandId: CommandId, ...args: string[]) {
    return Toast.showOutput(
      this.internalCommands.executeCommand(commandId, this.dvcRoot, ...args)
    )
  }

  private notifyChanged(data?: ExperimentsOutput) {
    this.experimentsChanged.fire(data)
    this.notifyMetricsOrParamsChanged()
  }

  private notifyMetricsOrParamsChanged() {
    this.metricsOrParamsChanged.fire()
    return this.sendWebviewData()
  }

  private sendWebviewData() {
    this.webview?.show(this.getWebviewData())
  }

  private getWebviewData() {
    return {
      changes: this.metricsAndParams.getChanges(),
      columnOrder: this.metricsAndParams.getColumnOrder(),
      columnWidths: this.metricsAndParams.getColumnWidths(),
      columns: this.metricsAndParams.getSelected(),
      rows: this.experiments.getRowData(),
      sorts: this.experiments.getSorts()
    }
  }

  private handleMessageFromWebview() {
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message => {
        switch (message.type) {
          case MessageFromWebviewType.COLUMN_REORDERED:
            return this.setColumnOrder(message.payload)
          case MessageFromWebviewType.COLUMN_RESIZED:
            return this.setColumnWidth(
              message.payload.id,
              message.payload.width
            )
          case MessageFromWebviewType.EXPERIMENT_TOGGLED:
            return this.setExperimentStatus(message.payload)
          case MessageFromWebviewType.COLUMN_SORTED:
            return this.addColumnSort(message.payload)
          case MessageFromWebviewType.COLUMN_SORT_REMOVED:
            return this.removeColumnSort(message.payload)
          case MessageFromWebviewType.CONTEXT_MENU_INVOKED:
            return this.invokeContextMenu(message.payload)
          default:
            Logger.error(`Unexpected message: ${JSON.stringify(message)}`)
        }
      })
    )
  }

  private setColumnOrder(order: string[]) {
    this.metricsAndParams.setColumnOrder(order)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_COLUMNS_REORDERED,
      undefined,
      undefined
    )
  }

  private setColumnWidth(id: string, width: number) {
    this.metricsAndParams.setColumnWidth(id, width)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_COLUMN_RESIZED,
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

  private addColumnSort(sort: SortDefinition) {
    this.experiments.addSort(sort)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_COLUMN_SORTED,
      { ...sort },
      undefined
    )
    return this.notifyChanged()
  }

  private removeColumnSort(path: string) {
    this.experiments.removeSort(path)
    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_COLUMN_SORT_REMOVED,
      { path },
      undefined
    )
    return this.notifyChanged()
  }

  private async invokeContextMenu({
    depth,
    queued,
    id
  }: ContextMenuPayload): Promise<void | unknown> {
    const items: QuickPickItemWithValue<
      () => void | Thenable<void | unknown>
    >[] = []
    if (depth === 0) {
      return
    }
    if (!queued) {
      items.push(
        {
          label: 'Apply to Workspace',
          value: () => this.runCommand(AvailableCommands.EXPERIMENT_APPLY, id)
        },
        {
          label: 'Create New Branch',
          value: async () => {
            const input = await getInput(Title.ENTER_BRANCH_NAME)
            if (input) {
              return this.runCommand(
                AvailableCommands.EXPERIMENT_BRANCH,
                id,
                input
              )
            }
          }
        }
      )
    }
    if (depth === 1) {
      items.push(
        {
          label: 'Vary Param(s) and Queue',
          value: async () => {
            const paramsToQueue = await this.pickParamsToQueue(id)
            if (paramsToQueue) {
              return this.runCommand(
                AvailableCommands.EXPERIMENT_QUEUE,
                ...paramsToQueue
              )
            }
          }
        },
        {
          label: 'Remove Experiment',
          value: () => this.runCommand(AvailableCommands.EXPERIMENT_REMOVE, id)
        }
      )
    }
    if (items.length > 0) {
      const callback = await quickPickValue(items, {})
      if (callback) {
        return callback()
      }
    }
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
}
