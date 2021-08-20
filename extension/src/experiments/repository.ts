import { join, resolve } from 'path'
import { Event, EventEmitter, Memento } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import {
  pickFilterToAdd,
  pickFiltersToRemove
} from './model/filterBy/quickPick'
import { ExperimentsWebview } from './webview'
import { ExperimentsModel } from './model'
import { ParamsAndMetricsModel } from './paramsAndMetrics/model'
import { SortDefinition } from './model/sortBy'
import { pickFromParamsAndMetrics } from './paramsAndMetrics/quickPick'
import { WorkspaceParamsAndMetrics } from './paramsAndMetrics/workspace'
import { ResourceLocator } from '../resourceLocator'
import { createNecessaryFileSystemWatcher } from '../fileSystem/watcher'
import { retryUntilAllResolved } from '../util/promise'
import { AvailableCommands, InternalCommands } from '../internalCommands'
import { ProcessManager } from '../processManager'
import { ExperimentsRepoJSONOutput } from '../cli/reader'
import { quickPickValue } from '../vscode/quickPick'

export const EXPERIMENTS_GIT_REFS = join('.git', 'refs', 'exps')

export class ExperimentsRepository {
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
  private paramsAndMetrics = this.dispose.track(new ParamsAndMetricsModel())

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly experimentsChanged = new EventEmitter<void>()
  private readonly paramsOrMetricsChanged = new EventEmitter<void>()

  private processManager: ProcessManager

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

    this.processManager = this.dispose.track(
      new ProcessManager({ name: 'refresh', process: () => this.updateData() })
    )

    this.updateData().then(() => {
      this.dispose.track(
        new WorkspaceParamsAndMetrics(dvcRoot, this.paramsAndMetrics, () =>
          this.refresh()
        )
      )

      this.deferred.resolve()
    })
  }

  public isReady() {
    return this.initialized
  }

  public onDidChangeData(gitRoot: string): void {
    const refsPath = resolve(gitRoot, EXPERIMENTS_GIT_REFS)
    this.dispose.track(
      createNecessaryFileSystemWatcher(refsPath, () => this.refresh())
    )
  }

  public refresh() {
    return this.processManager.run('refresh')
  }

  public getChildParamsOrMetrics(path: string) {
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

    const webview = await ExperimentsWebview.create(
      this.internalCommands,
      {
        dvcRoot: this.dvcRoot,
        tableData: this.getTableData()
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

  public addSort(sort: SortDefinition) {
    this.experiments.addSort(sort)
    return this.notifyChanged()
  }

  public getSorts() {
    return this.experiments.getSorts()
  }

  public async pickSort() {
    const paramsAndMetrics = this.paramsAndMetrics.getTerminalNodes()
    const picked = await pickFromParamsAndMetrics(paramsAndMetrics, {
      title: 'Select a param or metric to sort by'
    })
    if (picked === undefined) {
      return
    }
    const descending = await quickPickValue<boolean>(
      [
        { label: 'Ascending', value: false },
        { label: 'Descending', value: true }
      ],
      { title: 'Select a direction to sort in' }
    )
    if (descending === undefined) {
      return
    }
    return {
      descending,
      path: picked.path
    }
  }

  public removeSortByPath(pathToRemove: string) {
    this.experiments.removeSort(pathToRemove)
    return this.notifyChanged()
  }

  public async pickAndAddSort() {
    const pickedSort = await this.pickSort()
    if (pickedSort) {
      this.addSort(pickedSort)
    }
  }

  public removeSorts() {
    this.experiments.removeSorts()
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

  public async removeFilters() {
    const filters = this.experiments.getFilters()
    const filtersToRemove = await pickFiltersToRemove(filters)
    if (!filtersToRemove) {
      return
    }
    this.experiments.removeFilters(filtersToRemove)
    return this.notifyChanged()
  }

  public removeFilter(id: string) {
    if (this.experiments.removeFilter(id)) {
      return this.notifyChanged()
    }
  }

  public getExperiments() {
    return this.experiments.getExperiments()
  }

  public getCheckpoints(experimentId: string) {
    return this.experiments.getCheckpoints(experimentId)
  }

  private async updateData(): Promise<void> {
    const getNewPromise = () =>
      this.internalCommands.executeCommand<ExperimentsRepoJSONOutput>(
        AvailableCommands.EXPERIMENT_SHOW,
        this.dvcRoot
      )
    const data = await retryUntilAllResolved<ExperimentsRepoJSONOutput>(
      getNewPromise,
      'Experiments table update'
    )

    await Promise.all([
      this.paramsAndMetrics.transformAndSet(data),
      this.experiments.transformAndSet(data)
    ])

    return this.notifyChanged()
  }

  private notifyChanged() {
    this.experimentsChanged.fire()
    this.notifyParamsOrMetricsChanged()
  }

  private notifyParamsOrMetricsChanged() {
    this.paramsOrMetricsChanged.fire()
    return this.sendData()
  }

  private async sendData() {
    if (this.webview) {
      await this.webview.isReady()
      return this.webview.showExperiments({
        tableData: this.getTableData()
      })
    }
  }

  private getTableData() {
    return {
      columns: this.paramsAndMetrics.getSelected(),
      rows: this.experiments.getRowData()
    }
  }

  private resetWebview = () => {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }
}
