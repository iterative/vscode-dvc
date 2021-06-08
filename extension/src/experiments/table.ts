import { join, resolve } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './webview'
import { ExperimentsRepoJSONOutput } from './contract'
import { buildColumns, Column } from './buildColumns'
import { CliReader } from '../cli/reader'
import { Config } from '../config'
import { ResourceLocator } from '../resourceLocator'
import { onDidChangeFileSystem } from '../fileSystem/watcher'
import { retryUntilAllResolved } from '../util/promise'

export const EXPERIMENTS_GIT_REFS = join('.git', 'refs', 'exps')

export class ExperimentsTable {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly config: Config
  private readonly cliReader: CliReader

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise
  public isReady = () => this.initialized

  protected readonly isWebviewFocusedChanged: EventEmitter<
    string | undefined
  > = this.dispose.track(new EventEmitter())

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined> = this
    .isWebviewFocusedChanged.event

  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private data?: ExperimentsRepoJSONOutput

  private nestedColumns?: Column[]
  public getNestedColumns = () => this.nestedColumns

  private flatColumns?: Column[]
  public getFlatColumns = () => this.flatColumns

  public getDvcRoot = () => this.dvcRoot

  private async updateData(): Promise<void> {
    const getNewPromise = () => this.cliReader.experimentShow(this.dvcRoot)
    const data = await retryUntilAllResolved<ExperimentsRepoJSONOutput>(
      getNewPromise,
      'Experiments table update'
    )
    this.data = data
    const [nestedColumns, flatColumns] = buildColumns(data)
    this.nestedColumns = nestedColumns
    this.flatColumns = flatColumns
    this.sendData()
  }

  public onDidChangeData(gitRoot: string): void {
    const refsPath = resolve(gitRoot, EXPERIMENTS_GIT_REFS)
    this.dispose.track(onDidChangeFileSystem(refsPath, this.refresh))
  }

  private updateInProgress = false

  public refresh = async () => {
    if (!this.updateInProgress) {
      this.updateInProgress = true
      await this.updateData()
      this.updateInProgress = false
    }
  }

  public showWebview = async () => {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await ExperimentsWebview.create(
      this.config,
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

  private sendData() {
    if (this.data && this.webview) {
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

  constructor(
    dvcRoot: string,
    config: Config,
    cliReader: CliReader,
    resourceLocator: ResourceLocator
  ) {
    this.dvcRoot = dvcRoot
    this.config = config
    this.cliReader = cliReader
    this.resourceLocator = resourceLocator

    this.refresh().then(() => this.deferred.resolve())
  }
}
