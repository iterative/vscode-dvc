import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
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

export class Experiment {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly config: Config
  protected readonly activeStatusChanged: EventEmitter<
    string | undefined
  > = this.dispose.track(new EventEmitter())

  public readonly onDidChangeActiveStatus: Event<string | undefined> = this
    .activeStatusChanged.event

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
      this.dvcRoot,
      this.resourceLocator
    )

    this.setWebview(webview)
    this.sendData()

    this.activeStatusChanged.fire(this.dvcRoot)

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
    this.dispose.track(
      view.onDidChangeActiveStatus(dvcRoot => {
        this.activeStatusChanged.fire(dvcRoot)
      })
    )
  }

  private resetWebview = () => {
    this.activeStatusChanged.fire(undefined)
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
    this.config = config
    this.resourceLocator = resourceLocator

    this.updateData()
  }
}

export class Experiments {
  public dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }

  @observable
  private activeDvcRoot: string | undefined

  public getActive(): Experiment | undefined {
    if (!this.activeDvcRoot) {
      return undefined
    }
    return this.experiments[this.activeDvcRoot]
  }

  private experiments: Record<string, Experiment> = {}
  private config: Config

  public async showExperiment() {
    const dvcRoot = this.activeDvcRoot || (await getDvcRoot(this.config))

    if (!dvcRoot) {
      return
    }

    const experiment = this.experiments[dvcRoot]
    await experiment.showWebview()
    return experiment
  }

  private createExperiment(dvcRoot: string, resourceLocator: ResourceLocator) {
    const experiment = this.dispose.track(
      new Experiment(dvcRoot, this.config, resourceLocator)
    )

    this.experiments[dvcRoot] = experiment

    this.dispose.track(
      experiment.onDidChangeActiveStatus(
        dvcRoot => (this.activeDvcRoot = dvcRoot)
      )
    )
    return experiment
  }

  public create(
    dvcRoots: string[],
    resourceLocator: ResourceLocator
  ): Experiment[] {
    const experiments = dvcRoots.map(dvcRoot =>
      this.createExperiment(dvcRoot, resourceLocator)
    )
    this.deferred.resolve()
    return experiments
  }

  public reset(): void {
    Object.values(this.experiments).forEach(experiment => experiment.dispose())
    this.experiments = {}
  }

  public onDidChangeData(dvcRoot: string, gitRoot: string) {
    const experiment = this.experiments[dvcRoot]
    experiment.onDidChangeData(gitRoot)
  }

  constructor(config: Config, experiments?: Record<string, Experiment>) {
    makeObservable(this)

    this.config = config
    if (experiments) {
      this.experiments = experiments
    }
  }
}
