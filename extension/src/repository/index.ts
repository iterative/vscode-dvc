import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { observable, makeObservable } from 'mobx'
import { SourceControlManagement } from './views/sourceControlManagement'
import { DecorationProvider } from './decorationProvider'
import { RepositoryModel } from './model'
import { ListOutput, DiffOutput, StatusOutput, CliReader } from '../cli/reader'
import { getAllUntracked } from '../git'

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly dvcRoot: string
  private readonly cliReader: CliReader
  private decorationProvider?: DecorationProvider
  private readonly sourceControlManagement: SourceControlManagement

  @observable
  private model: RepositoryModel

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.model.getState()
  }

  private getUpdateData(): Promise<[DiffOutput, StatusOutput, Set<string>]> {
    return Promise.all([
      this.cliReader.diff(this.dvcRoot),
      this.cliReader.status(this.dvcRoot),
      getAllUntracked(this.dvcRoot)
    ])
  }

  private getRefreshData(): Promise<
    [DiffOutput, StatusOutput, Set<string>, ListOutput[]]
  > {
    return Promise.all([
      this.cliReader.diff(this.dvcRoot),
      this.cliReader.status(this.dvcRoot),
      getAllUntracked(this.dvcRoot),
      this.cliReader.listDvcOnlyRecursive(this.dvcRoot)
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
    cliReader: CliReader,
    decorationProvider?: DecorationProvider
  ) {
    makeObservable(this)
    this.cliReader = cliReader
    this.decorationProvider = decorationProvider
    this.dvcRoot = dvcRoot
    this.model = this.dispose.track(new RepositoryModel(dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.getState())
    )

    this.setup()
  }
}
