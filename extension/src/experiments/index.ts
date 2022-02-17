import { Event, EventEmitter, Memento } from 'vscode'
import { ExperimentsModel } from './model'
import { pickExperiments } from './model/quickPicks'
import { pickParamsToQueue } from './model/queue/quickPick'
import { pickExperiment } from './quickPick'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { MetricsAndParamsModel } from './metricsAndParams/model'
import { CheckpointsModel } from './checkpoints/model'
import { ExperimentsData } from './data'
import { TableData } from './webview/contract'
import { ResourceLocator } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { ExperimentsOutput } from '../cli/reader'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import {
  ColumnReorderPayload,
  ColumnResizePayload,
  MessageFromWebviewType
} from '../webview/contract'
import { Logger } from '../common/logger'
import { FileSystemData } from '../fileSystem/data'

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
      this.experiments.transformAndSet(data, this.checkpoints.hasCheckpoints())
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

  public removeFilter(id: string) {
    // if auto apply is being used need to calculate the number of experiments that will be selected
    // and pop a warning if > 6
    if (this.experiments.removeFilter(id)) {
      return this.notifyChanged()
    }
  }

  public async removeFilters() {
    const filters = this.experiments.getFilters()
    // if auto apply is being used need to calculate the number of experiments that will be selected and pop a warning if > 6
    const filtersToRemove = await pickFiltersToRemove(filters)
    if (!filtersToRemove) {
      return
    }
    this.experiments.removeFilters(filtersToRemove)
    return this.notifyChanged()
  }

  public async selectExperiments() {
    const experiments = this.experiments.getExperiments()

    // need this to limit to 6,
    // as a start could de-select all checkpoints, if not need to revisit the UI
    // use quickPick to limit amount of selectedItems can use createQuickPick, selectedItems and onDidChangeSelection
    const selected = await pickExperiments(experiments)
    if (!selected) {
      return
    }

    this.experiments.setSelectionMode(false)
    this.experiments.setSelected(selected)
    return this.notifyChanged()
  }

  public autoApplyFilters(useFilters: boolean) {
    // if auto apply is selected need to calculate the number of experiments that will be selected and pop a warning if > 6
    this.experiments.setSelectionMode(useFilters)

    if (useFilters) {
      this.experiments.setSelectedToFilters()
      return this.notifyChanged()
    }
  }

  public pickCurrentExperiment() {
    return pickExperiment(this.experiments.getCurrentExperiments())
  }

  public async pickParamsToQueue() {
    const base = await pickExperiment(this.experiments.getExperiments())

    if (!base) {
      return
    }

    const params = this.experiments.getExperimentParams(base.id)

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
            return (
              message.payload &&
              this.metricsAndParams.setColumnOrder(
                message.payload as ColumnReorderPayload
              )
            )
          case MessageFromWebviewType.COLUMN_RESIZED: {
            const { id, width } = message.payload as ColumnResizePayload
            return (
              message.payload && this.metricsAndParams.setColumnWidth(id, width)
            )
          }
          default:
            Logger.error(`Unexpected message: ${message}`)
        }
      })
    )
  }
}
