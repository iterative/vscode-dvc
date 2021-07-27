import { join, resolve } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './webview'
import { pickFilterToAdd, pickFiltersToRemove, pickSort } from './quickPick'
import { ExperimentsModel } from './model'
import { SortDefinition } from './model/sorting'
import { ResourceLocator } from '../resourceLocator'
import { onDidChangeFileSystem } from '../fileSystem/watcher'
import { retryUntilAllResolved } from '../util/promise'
import { AvailableCommands, InternalCommands } from '../internalCommands'
import { ProcessManager } from '../processManager'
import { ExperimentsRepoJSONOutput } from '../cli/reader'

export const EXPERIMENTS_GIT_REFS = join('.git', 'refs', 'exps')

export class ExperimentsRepository {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined>
  public readonly onDidChangeExperimentsRows: Event<void>
  public readonly onDidChangeParamsOrMetrics: Event<void>

  protected readonly isWebviewFocusedChanged: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  private readonly dvcRoot: string

  private readonly internalCommands: InternalCommands
  private readonly resourceLocator: ResourceLocator

  private webview?: ExperimentsWebview
  private model: ExperimentsModel

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly experimentsRowsChanged = new EventEmitter<void>()
  private readonly paramsOrMetricsChanged = new EventEmitter<void>()

  private processManager: ProcessManager

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands
    this.resourceLocator = resourceLocator
    this.model = this.dispose.track(new ExperimentsModel())

    this.onDidChangeIsWebviewFocused = this.isWebviewFocusedChanged.event
    this.onDidChangeExperimentsRows = this.experimentsRowsChanged.event
    this.onDidChangeParamsOrMetrics = this.paramsOrMetricsChanged.event

    this.processManager = this.dispose.track(
      new ProcessManager({ name: 'refresh', process: () => this.updateData() })
    )

    this.refresh().then(() => this.deferred.resolve())
  }

  public isReady() {
    return this.initialized
  }

  public onDidChangeData(gitRoot: string): void {
    const refsPath = resolve(gitRoot, EXPERIMENTS_GIT_REFS)
    this.dispose.track(onDidChangeFileSystem(refsPath, () => this.refresh()))
  }

  public refresh() {
    return this.processManager.run('refresh')
  }

  public getParamOrMetric(path: string) {
    return this.model.getParamOrMetric(path)
  }

  public getChildParamsOrMetrics(path: string) {
    return this.model.getChildParamsOrMetrics(path)
  }

  public toggleParamOrMetricStatus(path: string) {
    const status = this.model.toggleParamOrMetricStatus(path)

    this.notifyParamsOrMetricsChanged()

    return status
  }

  public showWebview = async () => {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await ExperimentsWebview.create(
      this.internalCommands,
      {
        dvcRoot: this.dvcRoot,
        tableData: this.model.getTableData()
      },
      this.resourceLocator
    )

    this.setWebview(webview)

    this.isWebviewFocusedChanged.fire(this.dvcRoot)

    return webview
  }

  public setWebview = (view: ExperimentsWebview) => {
    this.webview = this.dispose.track(view)
    this.sendData()
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

  public setSort(sort: SortDefinition | undefined) {
    this.model.setSort(sort)

    return this.notifyChanged()
  }

  public getSort() {
    return this.model.getSort()
  }

  public async pickSort() {
    const paramsAndMetrics = this.model.getTerminalParamsAndMetrics()
    const pickedSortDefinition = await pickSort(paramsAndMetrics)
    if (pickedSortDefinition) {
      return this.setSort(pickedSortDefinition)
    }
  }

  public getFilters() {
    return this.model.getFilters()
  }

  public getFilter(id: string) {
    return this.model.getFilter(id)
  }

  public async addFilter() {
    const paramsAndMetrics = this.model.getTerminalParamsAndMetrics()
    const filterToAdd = await pickFilterToAdd(paramsAndMetrics)
    if (!filterToAdd) {
      return
    }
    this.model.addFilter(filterToAdd)
    return this.notifyChanged()
  }

  public async removeFilters() {
    const filters = this.model.getFilters()
    const filtersToRemove = await pickFiltersToRemove(filters)
    if (!filtersToRemove) {
      return
    }
    this.model.removeFilters(filtersToRemove)
    return this.notifyChanged()
  }

  public removeFilter(id: string) {
    if (this.model.removeFilter(id)) {
      return this.notifyChanged()
    }
  }

  public getExperimentNames(): string[] {
    return this.model.getExperimentNames()
  }

  public getExperiment(name: string) {
    return this.model.getExperiment(name)
  }

  public getCheckpointNames(name: string) {
    return this.model.getCheckpointNames(name)
  }

  private async updateData(): Promise<boolean | undefined> {
    const getNewPromise = () =>
      this.internalCommands.executeCommand<ExperimentsRepoJSONOutput>(
        AvailableCommands.EXPERIMENT_SHOW,
        this.dvcRoot
      )
    const data = await retryUntilAllResolved<ExperimentsRepoJSONOutput>(
      getNewPromise,
      'Experiments table update'
    )

    this.model.transformAndSet(data)

    return this.notifyChanged()
  }

  private notifyChanged() {
    this.experimentsRowsChanged.fire()
    return this.notifyParamsOrMetricsChanged()
  }

  private notifyParamsOrMetricsChanged() {
    this.paramsOrMetricsChanged.fire()
    return this.sendData()
  }

  private async sendData() {
    if (this.webview) {
      await this.webview.isReady()
      return this.webview.showExperiments({
        tableData: this.model.getTableData()
      })
    }
  }

  private resetWebview = () => {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }
}
