import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { getAllUntracked } from '../git'
import { SourceControlManagement } from './views/SourceControlManagement'
import { DecorationProvider } from './DecorationProvider'
import { Deferred } from '@hediet/std/synchronization'
import {
  listDvcOnlyRecursive,
  status,
  diff,
  ListOutput,
  DiffOutput,
  StatusOutput
} from '../cli/reader'
import { observable, makeObservable } from 'mobx'
import { getExecutionOptions } from '../cli/execution'
import { RepositoryModel } from './Model'

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private config: Config
  private dvcRoot: string
  private decorationProvider?: DecorationProvider
  private sourceControlManagement: SourceControlManagement

  @observable
  private model: RepositoryModel

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.model.getState()
  }

  private getUpdateData(): Promise<[DiffOutput, StatusOutput, Set<string>]> {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    return Promise.all([
      diff(options),
      status(options),
      getAllUntracked(this.dvcRoot)
    ])
  }

  private getRefreshData(): Promise<
    [DiffOutput, StatusOutput, Set<string>, ListOutput[]]
  > {
    const options = getExecutionOptions(this.config, this.dvcRoot)
    return Promise.all([
      diff(options),
      status(options),
      getAllUntracked(this.dvcRoot),
      listDvcOnlyRecursive(options)
    ])
  }

  public async resetState() {
    const [
      diffFromHead,
      diffFromCache,
      untracked,
      tracked
    ] = await this.getRefreshData()

    this.model.setState({ diffFromCache, diffFromHead, tracked, untracked })

    this.setState()
  }

  private setState() {
    this.sourceControlManagement.setState(this.getState())
    this.decorationProvider?.setState(this.getState())
  }

  public async updateState() {
    const [diffFromHead, diffFromCache, untracked] = await this.getUpdateData()

    this.model.setState({ diffFromCache, diffFromHead, untracked })
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
    this.model = this.dispose.track(new RepositoryModel(dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.getState())
    )

    this.setup()
  }
}
