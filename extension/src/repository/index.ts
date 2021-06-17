import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { observable, makeObservable } from 'mobx'
import { SourceControlManagement } from './views/sourceControlManagement'
import { DecorationProvider } from './decorationProvider'
import { RepositoryModel } from './model'
import { ListOutput, DiffOutput, StatusOutput, CliReader } from '../cli/reader'
import { getAllUntracked } from '../git'
import { retryUntilAllResolved } from '../util/promise'
export class Repository {
  @observable
  private model: RepositoryModel

  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly dvcRoot: string
  private readonly cliReader: CliReader
  private decorationProvider?: DecorationProvider
  private readonly sourceControlManagement: SourceControlManagement

  private resetInProgress = false
  private updateInProgress = false

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

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.model.getState()
  }

  public async resetState() {
    if (!this.resetInProgress) {
      this.resetInProgress = true
      const [
        diffFromHead,
        diffFromCache,
        untracked,
        tracked
      ] = await this.getResetData()

      this.model.setState({ diffFromCache, diffFromHead, tracked, untracked })

      this.setState()
      this.resetInProgress = false
    }
  }

  public async updateState() {
    if (!this.updateInProgress && !this.resetInProgress) {
      this.updateInProgress = true
      const [
        diffFromHead,
        diffFromCache,
        untracked
      ] = await this.getUpdateData()

      this.model.setState({ diffFromCache, diffFromHead, untracked })
      this.setState()
      this.updateInProgress = false
    }
  }

  private getBaseData = (): [
    Promise<DiffOutput>,
    Promise<StatusOutput>,
    Promise<Set<string>>
  ] => [
    this.cliReader.diff(this.dvcRoot),
    this.cliReader.status(this.dvcRoot),
    getAllUntracked(this.dvcRoot)
  ]

  private getUpdateData = (): Promise<
    [DiffOutput, StatusOutput, Set<string>]
  > =>
    retryUntilAllResolved<[DiffOutput, StatusOutput, Set<string>]>(
      this.getBaseData,
      'Repository data update'
    )

  private getResetData = (): Promise<
    [DiffOutput, StatusOutput, Set<string>, ListOutput[]]
  > => {
    const getNewPromises = () => [
      ...this.getBaseData(),
      this.cliReader.listDvcOnlyRecursive(this.dvcRoot)
    ]
    return retryUntilAllResolved<
      [DiffOutput, StatusOutput, Set<string>, ListOutput[]]
    >(getNewPromises, 'Repository data update')
  }

  private setState() {
    this.sourceControlManagement.setState(this.getState())
    this.decorationProvider?.setState(this.getState())
  }

  private async setup() {
    await this.resetState()
    return this.deferred.resolve()
  }
}
