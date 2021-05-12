import { EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import { Runner } from '../cli/Runner'
import { Args } from '../cli/args'
import { ExperimentsWebview } from './Webview'
import { createHash } from 'crypto'
import { ResourceLocator } from '../ResourceLocator'

export class Experiments {
  public readonly dispose = Disposable.fn()

  private readonly config: Config
  private readonly dvcRoot: string
  private readonly runner: Runner
  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private currentUpdatePromise?: Thenable<ExperimentsRepoJSONOutput>

  private lastExperimentsOutputHash = ''
  private data?: ExperimentsRepoJSONOutput
  public getData() {
    return this.data
  }

  private dataUpdateStarted: EventEmitter<
    Thenable<ExperimentsRepoJSONOutput>
  > = this.dispose.track(new EventEmitter())

  public readonly onDidStartDataUpdate = this.dataUpdateStarted.event

  private dataUpdated: EventEmitter<
    ExperimentsRepoJSONOutput
  > = this.dispose.track(new EventEmitter())

  public readonly onDidUpdateData = this.dataUpdated.event

  private dataUpdateFailed: EventEmitter<Error> = this.dispose.track(
    new EventEmitter()
  )

  public readonly onDidFailDataUpdate = this.dataUpdateFailed.event

  private async update(): Promise<ExperimentsRepoJSONOutput> {
    if (!this.currentUpdatePromise) {
      try {
        const updatePromise = experimentShow({
          pythonBinPath: this.config.pythonBinPath,
          cliPath: this.config.getCliPath(),
          cwd: this.dvcRoot
        })
        this.currentUpdatePromise = updatePromise
        this.dataUpdateStarted.fire(updatePromise)
        const experimentData = await updatePromise
        this.dataUpdated.fire(experimentData)
        return experimentData
      } catch (e) {
        this.dataUpdateFailed.fire(e)
      } finally {
        this.currentUpdatePromise = undefined
      }
    }
    return this.currentUpdatePromise as Promise<ExperimentsRepoJSONOutput>
  }

  public refreshWebview = async () => {
    const tableData = await this.update()
    const outputHash = createHash('sha1')
      .update(JSON.stringify(tableData))
      .digest('base64')

    if (
      outputHash !== this.lastExperimentsOutputHash &&
      (await this.dataDelivered(tableData))
    ) {
      this.lastExperimentsOutputHash = outputHash
    }
  }

  private dataDelivered(
    tableData: ExperimentsRepoJSONOutput
  ): Thenable<boolean> {
    if (!this.webview) {
      return Promise.resolve(false)
    }
    return this.webview.showExperiments({
      tableData
    })
  }

  public showWebview = async () => {
    const webview = await this.findOrCreateWebview()
    await this.refreshWebview()
    return webview
  }

  private findOrCreateWebview = async (): Promise<ExperimentsWebview> => {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await ExperimentsWebview.create(
      this.config,
      this.resourceLocator
    )
    this.setWebview(webview)

    return webview
  }

  public async run(...args: Args) {
    await this.showWebview()
    this.runner.run(this.dvcRoot, ...args)
    const listener = this.dispose.track(
      this.runner.onDidCompleteProcess(() => {
        this.refreshWebview()
        this.dispose.untrack(listener)
        listener.dispose()
      })
    )
  }

  public stop() {
    return this.runner.stop()
  }

  public setWebview = (view: ExperimentsWebview) => {
    this.webview = this.dispose.track(view)
    this.dispose.track(
      view.onDidDispose(() => {
        this.resetWebview()
      })
    )
  }

  private resetWebview = () => {
    this.dispose.untrack(this.webview)
    this.webview = undefined
    this.lastExperimentsOutputHash = ''
  }

  constructor(
    dvcRoot: string,
    config: Config,
    resourceLocator: ResourceLocator
  ) {
    this.dvcRoot = dvcRoot

    if (!config) {
      throw new Error('The Experiments class requires a Config instance!')
    }
    this.config = config
    this.runner = this.dispose.track(new Runner(config))
    this.resourceLocator = resourceLocator
  }
}
