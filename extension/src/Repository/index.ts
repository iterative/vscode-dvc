import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from '../git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { DecorationProvider } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { diff, listDvcOnlyRecursive, status } from '../cli/reader'
import { observable, makeObservable } from 'mobx'
import { getExecutionOptions } from '../cli/execution'
import { RepositoryState, StatusOutput } from './State'

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.state
  }

  public getTracked() {
    return this.state.tracked
  }

  @observable
  private state: RepositoryState

  private config: Config
  private dvcRoot: string
  private decorationProvider?: DecorationProvider
  private sourceControlManagement: SourceControlManagement

  private async updateTracked(): Promise<void> {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const listOutput = await listDvcOnlyRecursive(options)
    this.state.updateTracked(listOutput)
  }

  public async updateStatus() {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const [diffFromHead, diffFromDvc] = await Promise.all([
      diff(options),
      status(options) as Promise<StatusOutput>
    ])
    return this.state.updateStatus(diffFromHead, diffFromDvc)
  }

  private async updateUntracked() {
    const untracked = await getAllUntracked(this.dvcRoot)
    this.state.updateUntracked(untracked)
  }

  private updateStatuses() {
    return Promise.all([this.updateUntracked(), this.updateStatus()])
  }

  public async resetState() {
    const statusesUpdated = this.updateStatuses()

    const slowerTrackedUpdated = this.updateTracked()

    await statusesUpdated
    this.sourceControlManagement.setState(this.state)

    await slowerTrackedUpdated
    this.decorationProvider?.setState(this.state)
  }

  private setState() {
    this.sourceControlManagement.setState(this.state)
    this.decorationProvider?.setState(this.state)
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
    this.state = this.dispose.track(new RepositoryState(this.dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.state)
    )

    this.setup()
  }
}
