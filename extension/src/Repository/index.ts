import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from '../git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { DecorationProvider } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import { listDvcOnlyRecursive, status, diff } from '../cli/reader'
import { observable, makeObservable } from 'mobx'
import { getExecutionOptions } from '../cli/execution'
import { RepositoryState } from './State'

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.state.getState()
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

  private async updateStatus() {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    const [diffFromHead, diffFromDvc] = await Promise.all([
      diff(options),
      status(options)
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
    this.sourceControlManagement.setState(this.state.getState())

    await slowerTrackedUpdated
    this.decorationProvider?.setState(this.state.getState())
  }

  private setState() {
    this.sourceControlManagement.setState(this.state.getState())
    this.decorationProvider?.setState(this.state.getState())
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
    this.state = this.dispose.track(new RepositoryState(dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.state)
    )

    this.setup()
  }
}
