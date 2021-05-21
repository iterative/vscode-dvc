import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
import { resolve } from 'path'
import { getExecutionOptions, ExecutionOptions } from '../cli/execution'
import { experimentShow } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import { ExperimentsWebview } from './Webview'
import { ResourceLocator } from '../ResourceLocator'
import { Logger } from '../common/Logger'
import { onDidChangeFileSystem } from '../fileSystem'
import { quickPickOne } from '../vscode/quickPick'
import { reportStderrOrThrow } from '../vscode/reporting'

export class ExperimentsTable {
  public readonly dispose = Disposable.fn()

  private readonly dvcRoot: string
  private readonly config: Config
  protected readonly isWebviewFocusedChanged: EventEmitter<
    string | undefined
  > = this.dispose.track(new EventEmitter())

  public readonly onDidChangeIsWebviewFocused: Event<string | undefined> = this
    .isWebviewFocusedChanged.event

  private webview?: ExperimentsWebview
  private readonly resourceLocator: ResourceLocator

  private currentUpdatePromise?: Thenable<ExperimentsRepoJSONOutput>
  private data?: ExperimentsRepoJSONOutput
  private error?: Error

  public getDvcRoot() {
    return this.dvcRoot
  }

  private async updateData(): Promise<ExperimentsRepoJSONOutput> {
    if (!this.currentUpdatePromise) {
      try {
        const options = getExecutionOptions(this.config, this.dvcRoot)
        const experimentData = experimentShow(options)
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
    try {
      const tableData = await this.updateData()
      this.data = tableData
      this.error = undefined
    } catch (e) {
      this.error = e
      reportStderrOrThrow(e)
    } finally {
      this.sendData()
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
        tableData: this.data,
        error: this.error
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
  private focusedWebviewDvcRoot: string | undefined

  public getFocused(): ExperimentsTable | undefined {
    if (!this.focusedWebviewDvcRoot) {
      return undefined
    }
    return this.experiments[this.focusedWebviewDvcRoot]
  }

  private experiments: Record<string, ExperimentsTable> = {}
  private config: Config

  public async showExperimentsTable() {
    const dvcRoot = await this.getDefaultOrPickDvcRoot()
    if (!dvcRoot) {
      return
    }

    return this.showExperimentsWebview(dvcRoot)
  }

  public async getExecutionOptions(): Promise<ExecutionOptions | undefined> {
    const dvcRoot = await this.getFocusedOrDefaultOrPickProject()
    if (!dvcRoot) {
      return
    }

    return { ...this.config.getExecutionOptions(), cwd: dvcRoot }
  }

  public async getExperimentsTableForCommand(): Promise<
    ExperimentsTable | undefined
  > {
    const dvcRoot = await this.getFocusedOrDefaultOrPickProject()
    if (!dvcRoot) {
      return
    }

    return this.showExperimentsWebview(dvcRoot)
  }

  private getFocusedOrDefaultOrPickProject() {
    return this.focusedWebviewDvcRoot || this.getDefaultOrPickDvcRoot()
  }

  private getDefaultOrPickDvcRoot() {
    return this.config.getDefaultProject() || this.pickDvcRoot()
  }

  private pickDvcRoot() {
    return quickPickOne(
      Object.keys(this.experiments),
      'Select which project to run command against'
    )
  }

  private async showExperimentsWebview(
    dvcRoot: string
  ): Promise<ExperimentsTable> {
    const experimentsTable = this.experiments[dvcRoot]
    await experimentsTable.showWebview()
    return experimentsTable
  }

  private createExperimentsTable(
    dvcRoot: string,
    resourceLocator: ResourceLocator
  ) {
    const experimentsTable = this.dispose.track(
      new ExperimentsTable(dvcRoot, this.config, resourceLocator)
    )

    this.experiments[dvcRoot] = experimentsTable

    this.dispose.track(
      experimentsTable.onDidChangeIsWebviewFocused(
        dvcRoot => (this.focusedWebviewDvcRoot = dvcRoot)
      )
    )
    return experimentsTable
  }

  public create(
    dvcRoots: string[],
    resourceLocator: ResourceLocator
  ): ExperimentsTable[] {
    const experiments = dvcRoots.map(dvcRoot =>
      this.createExperimentsTable(dvcRoot, resourceLocator)
    )
    this.deferred.resolve()
    return experiments
  }

  public reset(): void {
    Object.values(this.experiments).forEach(experimentsTable =>
      experimentsTable.dispose()
    )
    this.experiments = {}
  }

  public onDidChangeData(dvcRoot: string, gitRoot: string) {
    const experimentsTable = this.experiments[dvcRoot]
    experimentsTable.onDidChangeData(gitRoot)
  }

  public setWebview(dvcRoot: string, experimentsWebview: ExperimentsWebview) {
    const experimentsTable = this.experiments[dvcRoot]
    if (!experimentsTable) {
      experimentsWebview.dispose()
    }

    experimentsTable.setWebview(experimentsWebview)
  }

  constructor(config: Config, experiments?: Record<string, ExperimentsTable>) {
    makeObservable(this)

    this.config = config
    if (experiments) {
      this.experiments = experiments
    }
  }
}
