import { join, resolve } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './webview'
import {
  ExperimentsBranch,
  ExperimentsRepoJSONOutput,
  ExperimentsWorkspace
} from './contract'
import { transformExperimentsRepo, Column } from './transformExperimentsRepo'
import { ResourceLocator } from '../resourceLocator'
import { onDidChangeFileSystem } from '../fileSystem/watcher'
import { retryUntilAllResolved } from '../util/promise'
import { AvailableCommands, InternalCommands } from '../internalCommands'

export const EXPERIMENTS_GIT_REFS = join('.git', 'refs', 'exps')

export class ExperimentsTable {
  public readonly dispose = Disposable.fn()

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined>

  protected readonly isWebviewFocusedChanged: EventEmitter<string | undefined> =
    this.dispose.track(new EventEmitter())

  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private data?: ExperimentsRepoJSONOutput

  private columns?: { metrics?: Column[]; params?: Column[] }

  private updateInProgress = false
  private queuedRefresh = false

  private workspace?: ExperimentsWorkspace
  private branches?: ExperimentsBranch[]

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    resourceLocator: ResourceLocator
  ) {
    this.dvcRoot = dvcRoot
    this.internalCommands = internalCommands
    this.resourceLocator = resourceLocator

    this.onDidChangeIsWebviewFocused = this.isWebviewFocusedChanged.event

    this.refresh().then(() => this.deferred.resolve())
  }

  public isReady() {
    return this.initialized
  }

  public getColumns() {
    return this.columns
  }

  public getWorkspace() {
    return this.workspace
  }

  public getBranches() {
    return this.branches
  }

  public onDidChangeData(gitRoot: string): void {
    const refsPath = resolve(gitRoot, EXPERIMENTS_GIT_REFS)
    this.dispose.track(onDidChangeFileSystem(refsPath, this.refresh))
  }

  public refresh = async () => {
    if (this.updateInProgress) {
      return this.queueRefresh()
    }

    this.updateInProgress = true
    await this.updateData()
    this.updateInProgress = false
    this.processQueuedRefresh()
  }

  public showWebview = async () => {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await ExperimentsWebview.create(
      this.internalCommands,
      { dvcRoot: this.dvcRoot, experiments: this.data },
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
    this.data = data
    const { columns, branches, workspace } = transformExperimentsRepo(data)
    this.columns = columns
    this.branches = branches
    this.workspace = workspace
    return this.sendData()
  }

  private queueRefresh(): void {
    this.queuedRefresh = true
  }

  private processQueuedRefresh(): void {
    if (!this.queuedRefresh) {
      return
    }
    this.queuedRefresh = false
    this.refresh()
  }

  private async sendData() {
    if (this.data && this.webview) {
      await this.webview.isReady()
      return this.webview.showExperiments({
        tableData: this.data
      })
    }
  }

  private resetWebview = () => {
    this.isWebviewFocusedChanged.fire(undefined)
    this.dispose.untrack(this.webview)
    this.webview = undefined
  }
}
