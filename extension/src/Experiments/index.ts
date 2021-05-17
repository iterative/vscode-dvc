import { Disposable } from '@hediet/std/disposable'
import { resolve } from 'path'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import { ExperimentsWebview } from './Webview'
import { createHash } from 'crypto'
import { ResourceLocator } from '../ResourceLocator'
import { Logger } from '../common/Logger'
import { getDvcRoot } from '../fileSystem/workspace'
import { onDidChangeFileSystem } from '../fileSystem'

export class ExperimentsTable {
  public readonly dispose = Disposable.fn()

  private readonly config: Config
  private readonly dvcRoot: string
  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private currentUpdatePromise?: Thenable<ExperimentsRepoJSONOutput>
  private data?: ExperimentsRepoJSONOutput
  private lastDataHash = ''

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

  public onDidChangeData(gitRoot: string): void {
    const refsPath = resolve(gitRoot, '.git', 'refs', 'exps')
    this.dispose.track(onDidChangeFileSystem(refsPath, this.refresh))
  }

  public refresh = async () => {
    const tableData = await this.updateData()
    const dataHash = createHash('sha1')
      .update(JSON.stringify(tableData))
      .digest('base64')

    if (dataHash !== this.lastDataHash && (await this.dataDelivered())) {
      this.lastDataHash = dataHash
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
    this.lastDataHash = ''
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
    this.resourceLocator = resourceLocator

    this.updateData()
  }
}

export class Experiments {
  public dispose = Disposable.fn()

  private experiments: Record<string, ExperimentsTable> = {}
  private config: Config

  public async showExperiment() {
    const dvcRoot = await getDvcRoot(this.config)
    if (!dvcRoot) {
      return
    }

    const experiment = this.experiments[dvcRoot]
    await experiment?.showWebview()
    return experiment
  }

  public createExperiment(
    dvcRoot: string,
    resourceLocator: ResourceLocator
  ): void {
    this.experiments[dvcRoot] = this.dispose.track(
      new ExperimentsTable(dvcRoot, this.config, resourceLocator)
    )
  }

  public reset(): void {
    Object.values(this.experiments).forEach(experiment => experiment.dispose())
    this.experiments = {}
  }

  public onDidChangeData(dvcRoot: string, gitRoot: string) {
    const experiment = this.experiments[dvcRoot]
    experiment.onDidChangeData(gitRoot)
  }

  constructor(config: Config, experiments?: Record<string, ExperimentsTable>) {
    this.config = config
    if (experiments) {
      this.experiments = experiments
    }
  }
}
