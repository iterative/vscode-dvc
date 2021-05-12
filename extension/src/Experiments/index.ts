import { EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import { Runner } from '../cli/Runner'
import { WebviewManager } from '../webviews/WebviewManager'
import { Args } from '../cli/args'

export class Experiments {
  public readonly dispose = Disposable.fn()

  private config: Config
  private dvcRoot: string
  private runner: Runner
  private webviewManager: WebviewManager

  private currentUpdatePromise?: Thenable<ExperimentsRepoJSONOutput>

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

  public async update(): Promise<ExperimentsRepoJSONOutput> {
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

  public refreshWebview = async () =>
    this.webviewManager.refreshExperiments(this.dvcRoot, await this.update())

  public showWebview = async () => {
    const webview = await this.webviewManager.findOrCreateExperiments(
      this.dvcRoot
    )
    await this.refreshWebview()
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

  constructor(dvcRoot: string, config: Config, webviewManager: WebviewManager) {
    this.dvcRoot = dvcRoot

    if (!config) {
      throw new Error('The Experiments class requires a Config instance!')
    }
    this.config = config
    this.runner = this.dispose.track(new Runner(config))
    this.webviewManager = webviewManager
  }
}
