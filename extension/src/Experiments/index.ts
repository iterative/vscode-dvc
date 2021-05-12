import { Disposable } from '@hediet/std/disposable'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import { Runner } from '../cli/Runner'
import { Args } from '../cli/args'
import { ExperimentsWebview } from './Webview'
import { createHash } from 'crypto'
import { ResourceLocator } from '../ResourceLocator'
import { Logger } from '../common/Logger'

export class Experiments {
  public readonly dispose = Disposable.fn()

  private readonly config: Config
  private readonly dvcRoot: string
  private readonly runner: Runner
  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private currentUpdatePromise?: Thenable<ExperimentsRepoJSONOutput>
  private data?: ExperimentsRepoJSONOutput
  private lastExperimentsOutputHash = ''

  private async updateData(): Promise<ExperimentsRepoJSONOutput> {
    if (!this.currentUpdatePromise) {
      try {
        const experimentData = experimentShow({
          pythonBinPath: this.config.pythonBinPath,
          cliPath: this.config.getCliPath(),
          cwd: this.dvcRoot
        })
        this.currentUpdatePromise = experimentData
        this.data = await experimentData
        return experimentData
      } catch (e) {
        Logger.error(e)
      } finally {
        this.currentUpdatePromise = undefined
      }
    }
    return this.currentUpdatePromise as Promise<ExperimentsRepoJSONOutput>
  }

  public refreshWebview = async () => {
    const tableData = await this.updateData()
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

    if (this.data) {
      webview.showExperiments({
        tableData: this.data
      })
    }

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
    runner: Runner,
    resourceLocator: ResourceLocator
  ) {
    this.dvcRoot = dvcRoot
    this.runner = runner

    if (!config) {
      throw new Error('The Experiments class requires a Config instance!')
    }
    this.config = config
    this.resourceLocator = resourceLocator

    this.updateData()
  }
}
