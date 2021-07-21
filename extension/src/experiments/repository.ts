import { join, resolve } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './webview'
import { SortDefinition } from './sorting'
import { pickFilter, pickFiltersToRemove, pickSort } from './quickPick'
import { ExperimentsModel } from './model'
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
  public readonly onDidChangeExperimentsColumns: Event<void>

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
  private readonly experimentsColumnsChanged = new EventEmitter<void>()

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
    this.onDidChangeExperimentsColumns = this.experimentsColumnsChanged.event

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

  public getColumn(path: string) {
    return this.model.getColumn(path)
  }

  public getChildColumns(path: string) {
    return this.model.getChildColumns(path)
  }

  public toggleColumnStatus(path: string) {
    const status = this.model.toggleColumnStatus(path)

    this.notifyColumnsChanged()

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

  public async pickSort() {
    const columns = this.model.getColumns()
    const pickedSortDefinition = await pickSort(columns)
    if (pickedSortDefinition) {
      return this.setSort(pickedSortDefinition)
    }
  }

  public async addFilter() {
    const columns = this.model.getTerminalNodeColumns()
    const filterToAdd = await pickFilter(columns)
    if (!filterToAdd) {
      return
    }
    this.model.addFilter(filterToAdd)
    return filterToAdd
  }

  public async removeFilter() {
    const filters = this.model.getFilters()
    const filtersToRemove = await pickFiltersToRemove(filters)
    if (!filtersToRemove) {
      return
    }
    this.model.removeFilters(filtersToRemove)
  }

  public getRunningOrQueued(): string[] {
    return this.model.getRunningOrQueued()
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
    return this.notifyColumnsChanged()
  }

  private notifyColumnsChanged() {
    this.experimentsColumnsChanged.fire()
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
