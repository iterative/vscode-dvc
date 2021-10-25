import { join } from 'path'
import { Event, EventEmitter, Memento } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsModel } from './model'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { pickSortsToRemove, pickSortToAdd } from './model/sortBy/quickPick'
import { ParamsAndMetricsModel } from './paramsAndMetrics/model'
import { ExperimentsWebview } from './webview'
import { ResourceLocator } from '../resourceLocator'
import { InternalCommands } from '../commands/internal'
import { ExperimentsRepoJSONOutput } from '../cli/reader'
import { createWebview } from '../webview/factory'

const DOT_GIT = '.git'
const GIT_REFS = join(DOT_GIT, 'refs')
export const EXPERIMENTS_GIT_REFS = join(GIT_REFS, 'exps')

export class Experiments {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined>
  public readonly onDidChangeExperiments: Event<void>
  public readonly onDidChangeParamsOrMetrics: Event<void>

  protected readonly isWebviewFocusedChanged: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  private readonly dvcRoot: string

  private readonly internalCommands: InternalCommands
  private readonly resourceLocator: ResourceLocator

  private webview?: ExperimentsWebview
  private experiments: ExperimentsModel
  private paramsAndMetrics: ParamsAndMetricsModel

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly experimentsChanged = new EventEmitter<void>()
  private readonly paramsOrMetricsChanged = new EventEmitter<void>()

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator,
    workspaceState: Memento
  ) {
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands
    this.resourceLocator = resourceLocator

    this.onDidChangeIsWebviewFocused = this.isWebviewFocusedChanged.event
    this.onDidChangeExperiments = this.experimentsChanged.event
    this.onDidChangeParamsOrMetrics = this.paramsOrMetricsChanged.event

    this.experiments = this.dispose.track(
      new ExperimentsModel(dvcRoot, workspaceState)
    )

    this.paramsAndMetrics = this.dispose.track(
      new ParamsAndMetricsModel(dvcRoot, workspaceState)
    )

    const waitForInitialData = this.dispose.track(
      this.onDidChangeExperiments(() => {
        this.deferred.resolve()
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
      })
    )
  }

  public isReady() {
    return this.initialized
  }

  public async setState(data: ExperimentsRepoJSONOutput) {
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

  public showWebview = async () => {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = (await createWebview(
      ExperimentsWebview,
      this.internalCommands,
      {
        dvcRoot: this.dvcRoot,
        webviewData: this.getTableData()
      },
      this.resourceLocator.dvcIcon
    )) as ExperimentsWebview

    this.setWebview(webview)

    this.isWebviewFocusedChanged.fire(this.dvcRoot)

    return webview
  }

  public setWebview(view: ExperimentsWebview) {
    this.webview = this.dispose.track(view)
    view.isReady().then(() => this.sendData())

    this.dispose.track(
      view.onDidDispose(() => {
        this.resetWebview()
      })
    )
    this.dispose.track(
      view.onDidChangeIsFocused(dvcRoot => {
        this.isWebviewFocusedChanged.fire(dvcRoot)
      })
    )
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

  private notifyChanged() {
    this.experimentsChanged.fire()
    this.notifyParamsOrMetricsChanged()
  }

  private notifyParamsOrMetricsChanged() {
    this.paramsOrMetricsChanged.fire()
    return this.sendData()
  }

  private sendData() {
    if (this.webview) {
      this.webview.showExperiments({
        webviewData: this.getTableData()
      })
    }
  }

  private getTableData() {
    return {
      changes: this.paramsAndMetrics.getChanges(),
      columns: this.paramsAndMetrics.getSelected(),
      columnsOrder: this.paramsAndMetrics.getColumnsOrder(),
      rows: this.experiments.getRowData(),
      sorts: this.experiments.getSorts()
    }
  }

  private resetWebview = () => {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }
}
