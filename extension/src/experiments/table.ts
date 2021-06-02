import { createHash } from 'crypto'
import { resolve } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './webview'
import { ExperimentsRepoJSONOutput } from './contract'
import { CliReader } from '../cli/reader'
import { Config } from '../config'
import { ResourceLocator } from '../resourceLocator'
import { onDidChangeFileSystem } from '../fileSystem/watcher'
import { Logger } from '../common/logger'

export class ExperimentsTable {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly config: Config
  private readonly cliReader: CliReader

  protected readonly isWebviewFocusedChanged: EventEmitter<
    string | undefined
  > = this.dispose.track(new EventEmitter())

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined> = this
    .isWebviewFocusedChanged.event

  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private currentUpdatePromise?: Promise<void>
  private data?: ExperimentsRepoJSONOutput
  private lastDataHash = ''

  public getDvcRoot() {
    return this.dvcRoot
  }

  private async performUpdate(): Promise<void> {
    try {
      const experimentUpdatePromise = this.cliReader.experimentShow(
        this.dvcRoot
      )
      const tableData = await experimentUpdatePromise
      const dataHash = createHash('sha1')
        .update(JSON.stringify(tableData))
        .digest('base64')

      if (dataHash === this.lastDataHash) {
        return
      }
      this.lastDataHash = dataHash
      this.data = tableData
      this.sendData()
    } catch (e) {
      Logger.error(e)
      throw e
    } finally {
      this.currentUpdatePromise = undefined
    }
  }

  public refresh(): Promise<void> {
    if (!this.currentUpdatePromise) {
      this.currentUpdatePromise = this.performUpdate()
    }
    return this.currentUpdatePromise
  }

  public onDidChangeData(gitRoot: string): void {
    const refsPath = resolve(gitRoot, '.git', 'refs', 'exps')
    this.dispose.track(onDidChangeFileSystem(refsPath, () => this.refresh))
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
    this.lastDataHash = ''
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

    this.refresh()
  }
}
