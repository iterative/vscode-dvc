import { Event, EventEmitter, Memento } from 'vscode'
import { ExperimentsModel } from './model'
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
  public readonly onDidChangeExperiments: Event<void>
  public readonly onDidChangeParamsOrMetrics: Event<void>
  public readonly onDidChangeLivePlots: Event<void>

  public readonly viewKey = ViewKey.EXPERIMENTS

  private data: ExperimentsData

  private experiments: ExperimentsModel
  private paramsAndMetrics: ParamsAndMetricsModel

  private readonly experimentsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly paramsOrMetricsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly livePlotsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator,
    workspaceState: Memento,
    data = new ExperimentsData(dvcRoot, internalCommands)
  ) {
    super(dvcRoot, internalCommands, resourceLocator.beaker)

    this.onDidChangeExperiments = this.experimentsChanged.event
    this.onDidChangeParamsOrMetrics = this.paramsOrMetricsChanged.event
    this.onDidChangeLivePlots = this.livePlotsChanged.event

    this.experiments = this.dispose.track(
      new ExperimentsModel(dvcRoot, workspaceState)
    )

    this.paramsAndMetrics = this.dispose.track(
      new ParamsAndMetricsModel(dvcRoot, workspaceState)
    )

    this.data = this.dispose.track(data)

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
    this.data.update()
  }

  public async setState(data: ExperimentsOutput) {
    await Promise.all([
      this.paramsAndMetrics.transformAndSet(data),
      this.experiments.transformAndSet(data)
    ])

    return this.notifyChanged()
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

  public getExperiments() {
    return this.experiments.getExperiments()
  }

  public getCheckpoints(experimentId: string) {
    return this.experiments.getCheckpoints(experimentId)
  }

  public getLivePlots() {
    return this.experiments.getLivePlots()
  }

  public getWebviewData() {
    return {
      changes: this.paramsAndMetrics.getChanges(),
      columns: this.paramsAndMetrics.getSelected(),
      columnsOrder: this.paramsAndMetrics.getColumnsOrder(),
      rows: this.experiments.getRowData(),
      sorts: this.experiments.getSorts()
    }
  }

  private notifyChanged() {
    this.livePlotsChanged.fire()
    this.experimentsChanged.fire()
    this.notifyParamsOrMetricsChanged()
  }

  private notifyParamsOrMetricsChanged() {
    this.paramsOrMetricsChanged.fire()
    return this.sendWebviewData()
  }

  private handleMessageFromWebview() {
    this.dispose.track(
      this.onDidReceivedWebviewMessage(message => {
        switch (message.type) {
          case MessageFromWebviewType.columnReordered:
            return (
              message.payload &&
              this.paramsAndMetrics.setColumnsOrder(
                message.payload as ColumnReorderPayload
              )
            )
          case MessageFromWebviewType.columnResized: {
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
