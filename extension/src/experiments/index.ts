import { Event, EventEmitter, Memento } from 'vscode'
import { ExperimentsModel } from './model'
import { pickExperiments } from './model/quickPicks'
import { pickParamsAndVary } from './model/queue/quickPick'
import { pickExperimentName } from './quickPick'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { ParamsAndMetricsModel } from './paramsAndMetrics/model'
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

export class Experiments extends BaseRepository<TableData> {
  public readonly onDidChangeExperiments: Event<ExperimentsOutput | void>
  public readonly onDidChangeParamsOrMetrics: Event<void>

  public readonly viewKey = ViewKey.EXPERIMENTS

  private readonly data: ExperimentsData

  private readonly experiments: ExperimentsModel
  private readonly paramsAndMetrics: ParamsAndMetricsModel

  private readonly experimentsChanged = this.dispose.track(
    new EventEmitter<ExperimentsOutput | void>()
  )

  private readonly paramsOrMetricsChanged = this.dispose.track(
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
    this.onDidChangeParamsOrMetrics = this.paramsOrMetricsChanged.event

    this.experiments = this.dispose.track(
      new ExperimentsModel(dvcRoot, workspaceState)
    )

    this.paramsAndMetrics = this.dispose.track(
      new ParamsAndMetricsModel(dvcRoot, workspaceState)
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
      this.paramsAndMetrics.transformAndSet(data),
      this.experiments.transformAndSet(data)
    ])

    return this.notifyChanged(data)
  }

  public getChildParamsOrMetrics(path?: string) {
    return this.paramsAndMetrics.getChildren(path)
  }

  public toggleParamOrMetricStatus(path: string) {
    const status = this.paramsAndMetrics.toggleStatus(path)

    this.notifyParamsOrMetricsChanged()

    return status
  }

  public getParamsAndMetricsStatuses() {
    return this.paramsAndMetrics.getTerminalNodeStatuses()
  }

  public toggleExperimentStatus(experimentId: string) {
    const status = this.experiments.toggleStatus(experimentId)
    this.notifyChanged()
    return status
  }

  public getSorts() {
    return this.experiments.getSorts()
  }

  public async addSort() {
    const paramsAndMetrics = this.paramsAndMetrics.getTerminalNodes()
    const sortToAdd = await pickSortToAdd(paramsAndMetrics)
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
    const paramsAndMetrics = this.paramsAndMetrics.getTerminalNodes()
    const filterToAdd = await pickFilterToAdd(paramsAndMetrics)
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

  public async pickParamsToQueue() {
    const base = await pickExperimentName(this.experiments.getExperimentNames())

    if (!base) {
      return
    }

    const params = this.experiments.getExperimentParams(base)

    if (!params) {
      return
    }

    return pickParamsAndVary(params)
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
    this.notifyParamsOrMetricsChanged()
  }

  private notifyParamsOrMetricsChanged() {
    this.paramsOrMetricsChanged.fire()
    return this.sendWebviewData()
  }

  private sendWebviewData() {
    this.webview?.show(this.getWebviewData())
  }

  private getWebviewData() {
    return {
      changes: this.paramsAndMetrics.getChanges(),
      columnOrder: this.paramsAndMetrics.getColumnOrder(),
      columnWidths: this.paramsAndMetrics.getColumnWidths(),
      columns: this.paramsAndMetrics.getSelected(),
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
              this.paramsAndMetrics.setColumnOrder(
                message.payload as ColumnReorderPayload
              )
            )
          case MessageFromWebviewType.COLUMN_RESIZED: {
            const { id, width } = message.payload as ColumnResizePayload
            return (
              message.payload && this.paramsAndMetrics.setColumnWidth(id, width)
            )
          }
          default:
            Logger.error(`Unexpected message: ${message}`)
        }
      })
    )
  }
}
