import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
import { resolve } from 'path'
import { CliReader } from '../cli/reader'
import { Config } from '../Config'
import { ExperimentsRepoJSONOutput } from '../Experiments/Webview/contract'
import { ExperimentsWebview } from './Webview'
import { createHash } from 'crypto'
import { ResourceLocator } from '../ResourceLocator'
import { Logger } from '../common/Logger'
import { onDidChangeFileSystem } from '../fileSystem'
import { quickPickOne } from '../vscode/quickPick'
import { pickExperimentName } from './commands/quickPick'

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

  private currentUpdatePromise?: Thenable<ExperimentsRepoJSONOutput>
  private data?: ExperimentsRepoJSONOutput
  private lastDataHash = ''

  public getDvcRoot() {
    return this.dvcRoot
  }

  private async updateData(): Promise<ExperimentsRepoJSONOutput> {
    if (!this.currentUpdatePromise) {
      try {
        const experimentData = this.cliReader.experimentShow(this.dvcRoot)
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

    this.updateData()
  }
}

export class Experiments {
  public dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise
  private readonly cliReader: CliReader

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

  public getCwd(): Promise<string | undefined> {
    return this.getFocusedOrDefaultOrPickProject()
  }

  public async getExperimentName(): Promise<{
    name: string | undefined
    cwd: string | undefined
  }> {
    const dvcRoot = await this.getFocusedOrDefaultOrPickProject()
    if (!dvcRoot) {
      return { name: undefined, cwd: dvcRoot }
    }
    const experimentNames = await this.cliReader.experimentListCurrent(dvcRoot)
    const name = await pickExperimentName(experimentNames)

    return {
      name,
      cwd: dvcRoot
    }
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

  private async getDvcRoot(
    chooserFn: (keys: string[]) => string | Thenable<string | undefined>
  ) {
    const keys = Object.keys(this.experiments)
    if (keys.length === 1) {
      return keys[0]
    }
    return await chooserFn(keys)
  }

  private getFocusedOrDefaultOrPickProject = () =>
    this.getDvcRoot(
      keys =>
        this.focusedWebviewDvcRoot ||
        this.config.getDefaultProject() ||
        this.showDvcRootQuickPick(keys)
    )

  private getDefaultOrPickDvcRoot = () =>
    this.getDvcRoot(
      keys => this.config.getDefaultProject() || this.showDvcRootQuickPick(keys)
    )

  private showDvcRootQuickPick(keys: string[]) {
    return quickPickOne(keys, 'Select which project to run command against')
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
      new ExperimentsTable(
        dvcRoot,
        this.config,
        this.cliReader,
        resourceLocator
      )
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

  constructor(
    config: Config,
    cliReader: CliReader,
    experiments?: Record<string, ExperimentsTable>
  ) {
    makeObservable(this)

    this.config = config
    this.cliReader = cliReader
    if (experiments) {
      this.experiments = experiments
    }
  }
}
