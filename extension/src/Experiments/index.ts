import { Disposable } from '@hediet/std/disposable'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import { Runner } from '../cli/Runner'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommands
} from '../cli/args'
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

  public getDvcRoot() {
    return this.dvcRoot
  }

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

  public refresh = async () => {
    const tableData = await this.updateData()
    const outputHash = createHash('sha1')
      .update(JSON.stringify(tableData))
      .digest('base64')

    if (
      outputHash !== this.lastExperimentsOutputHash &&
      (await this.dataDelivered())
    ) {
      this.lastExperimentsOutputHash = outputHash
    }
  }

  private async dataDelivered(): Promise<boolean> {
    const sent = await this.sendData()
    return !!sent
  }

  public showWebview = async () => {
    if (this.webview) {
      return this.webview.reveal()
    }

    const webview = await ExperimentsWebview.create(
      this.config,
      this.resourceLocator
    )
    this.setWebview(webview)
    this.sendData()

    return webview
  }

  private sendData() {
    if (this.data && this.webview) {
      return this.webview.showExperiments({
        tableData: this.data
      })
    }
  }

  public runReset() {
    return this.run(ExperimentFlag.RESET)
  }

  public runQueued() {
    return this.run(ExperimentFlag.RUN_ALL)
  }

  public async run(...args: Args) {
    await this.showWebview()
    this.runner.run(
      this.dvcRoot,
      Command.EXPERIMENT,
      ExperimentSubCommands.RUN,
      ...args
    )
    const listener = this.dispose.track(
      this.runner.onDidCompleteProcess(() => {
        this.refresh()
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
