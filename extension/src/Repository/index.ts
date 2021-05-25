import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from '../git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { DecorationProvider } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { listDvcOnlyRecursive, status, diff } from '../cli/reader'
import { observable, makeObservable } from 'mobx'
import { getExecutionOptions } from '../cli/execution'
import { Model } from './Model'

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private config: Config
  private dvcRoot: string
  private decorationProvider?: DecorationProvider
  private sourceControlManagement: SourceControlManagement

  @observable
  private model: Model

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.model.getState()
  }

  private async updateTracked(): Promise<void> {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const listOutput = await listDvcOnlyRecursive(options)

    this.model.updateTracked(listOutput)
  }

  private async updateStatus() {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const [diffFromHead, diffFromCache] = await Promise.all([
      diff(options),
      status(options)
    ])
    return this.model.updateStatus(diffFromHead, diffFromCache)
  }

  private async updateUntracked() {
    const untracked = await getAllUntracked(this.dvcRoot)
    this.model.updateUntracked(untracked)
  }

  private updateStatuses() {
    return Promise.all([this.updateUntracked(), this.updateStatus()])
  }

  public async resetState() {
    const statusesUpdated = this.updateStatuses()

    const slowerTrackedUpdated = this.updateTracked()

    await statusesUpdated
    this.sourceControlManagement.setState(this.getState())

    await slowerTrackedUpdated
    this.decorationProvider?.setState(this.getState())
  }

  private setState() {
    this.sourceControlManagement.setState(this.getState())
    this.decorationProvider?.setState(this.getState())
  }

  public async updateState() {
    await this.updateStatuses()
    this.setState()
  }

  private async setup() {
    await this.resetState()
    return this.deferred.resolve()
  }

  constructor(
    dvcRoot: string,
    config: Config,
    decorationProvider?: DecorationProvider
  ) {
    makeObservable(this)
    this.config = config
    this.decorationProvider = decorationProvider
    this.dvcRoot = dvcRoot
    this.model = this.dispose.track(new Model(dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.getState())
    )

    this.setup()
  }
}
