import { Event, EventEmitter, Memento } from 'vscode'
import { ExperimentsModel } from './model'
import { pickExperiments } from './model/quickPicks'
import { pickParamsToQueue } from './model/queue/quickPick'
import { pickExperimentName } from './quickPick'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { MetricsAndParamsModel } from './metricsAndParams/model'
import { ExperimentsData } from './data'
import { TableData } from './webview/contract'
import { SortDefinition } from './model/sortBy'
import { ResourceLocator } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { ExperimentsOutput } from '../cli/reader'
import { ViewKey } from '../webview/constants'
import { BaseRepository } from '../webview/repository'
import {
  ColumnReorderPayload,
  ColumnResizePayload,
  ColumnSortRequestPayload,
  MessageFromWebviewType
} from '../webview/contract'
import { Logger } from '../common/logger'

export class Experiments extends BaseRepository<TableData> {
  public readonly onDidChangeExperiments: Event<ExperimentsOutput | void>
  public readonly onDidChangeMetricsOrParams: Event<void>

  public readonly viewKey = ViewKey.EXPERIMENTS

  private readonly data: ExperimentsData

  private readonly experiments: ExperimentsModel
  private readonly metricsAndParams: MetricsAndParamsModel

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
    data?: ExperimentsData
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

    this.data = this.dispose.track(
      data || new ExperimentsData(dvcRoot, internalCommands, updatesPaused)
    )

    this.dispose.track(this.data.onDidUpdate(data => this.setState(data)))

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
    return this.data.managedUpdate()
  }

  public forceUpdate() {
    return this.data.forceUpdate()
  }

  public async setState(data: ExperimentsOutput) {
    await Promise.all([
      this.metricsAndParams.transformAndSet(data),
      this.experiments.transformAndSet(data)
    ])

    return this.notifyChanged(data)
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

  public toggleExperimentStatus(experimentId: string) {
    const status = this.experiments.toggleStatus(experimentId)
    this.notifyChanged()
    return status
  }

  public getSorts() {
    return this.experiments.getSorts()
  }

  public async addSort(sortToAdd?: SortDefinition) {
    const metricsAndParams = this.metricsAndParams.getTerminalNodes()
    if (!sortToAdd) {
      sortToAdd = await pickSortToAdd(metricsAndParams)
    }

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
    if (this.experiments.removeFilter(id)) {
      return this.notifyChanged()
    }
  }

  public async removeFilters() {
    const filters = this.experiments.getFilters()
    const filtersToRemove = await pickFiltersToRemove(filters)
    if (!filtersToRemove) {
      return
    }
    this.experiments.removeFilters(filtersToRemove)
    return this.notifyChanged()
  }

  public async selectExperiments() {
    const experiments = this.experiments.getSelectable()

    const selected = await pickExperiments(experiments)
    if (!selected) {
      return
    }

    this.experiments.setSelectionMode(false)
    this.experiments.setSelected(selected)
    return this.notifyChanged()
  }

  public autoApplyFilters(useFilters: boolean) {
    this.experiments.setSelectionMode(useFilters)

    if (useFilters) {
      this.experiments.setSelectedToFilters()
      return this.notifyChanged()
    }
  }

  public pickCurrentExperimentName() {
    return pickExperimentName(this.experiments.getCurrentExperimentNames())
  }

  public async pickParamsToQueue() {
    const base = await pickExperimentName(this.experiments.getExperimentNames())

    if (!base) {
      return
    }

    const params = this.experiments.getExperimentParams(base)

    if (!params) {
      return
    }

    return pickParamsToQueue(params)
  }

  public getExperiments() {
    return this.experiments.getExperiments()
  }

  public getCheckpoints(experimentId: string) {
    return this.experiments.getCheckpoints(experimentId)
  }

  public sendInitialWebviewData() {
    return this.sendWebviewData()
  }

  public getSelectedExperiments() {
    return this.experiments.getSelected()
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
          case MessageFromWebviewType.COLUMN_SORT_REQUESTED: {
            const { descending, path } =
              message.payload as ColumnSortRequestPayload
            return message.payload && this.addSort({ descending, path })
          }
          case MessageFromWebviewType.COLUMN_REMOVE_SORT_REQUESTED: {
            const { path } = message.payload as ColumnSortRequestPayload
            return message.payload && this.removeSort(path)
          }
          default:
            Logger.error(`Unexpected message: ${message}`)
        }
      })
    )
  }
}
