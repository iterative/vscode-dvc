import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { observable, makeObservable } from 'mobx'
import { SourceControlManagement } from './sourceControlManagement'
import { DecorationProvider } from './decorationProvider'
import { RepositoryModel } from './model'
import { ListOutput, DiffOutput, StatusOutput } from '../cli/reader'
import { getAllUntracked } from '../git'
import { retryUntilAllResolved } from '../util/promise'
import { AvailableCommands, InternalCommands } from '../internalCommands'
import { ProcessManager } from '../processManager'
export class Repository {
  @observable
  private model: RepositoryModel

  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands
  private decorationProvider?: DecorationProvider
  private readonly sourceControlManagement: SourceControlManagement

  private processManager: ProcessManager

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    decorationProvider?: DecorationProvider
  ) {
    makeObservable(this)
    this.internalCommands = internalCommands
    this.decorationProvider = decorationProvider
    this.dvcRoot = dvcRoot
    this.model = this.dispose.track(new RepositoryModel(dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.getState())
    )

    this.processManager = this.dispose.track(
      new ProcessManager(
        { name: 'update', process: () => this.updateState() },
        { name: 'reset', process: () => this.resetState() }
      )
    )

    this.setup()
  }

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.model.getState()
  }

  public reset(): Promise<void> {
    return this.processManager.run('reset')
  }

  public update(): Promise<void> {
    if (this.processManager.isOngoingOrQueued('reset')) {
      return this.processManager.queue('reset')
    }

    return this.processManager.run('update')
  }

  private async resetState() {
    const [diffFromHead, diffFromCache, untracked, tracked] =
      await this.getResetData()

    this.model.setState({ diffFromCache, diffFromHead, tracked, untracked })

    this.setState()
  }

  private async updateState() {
    const [diffFromHead, diffFromCache, untracked] = await this.getUpdateData()

    this.model.setState({ diffFromCache, diffFromHead, untracked })
    this.setState()
  }

  private getBaseData = (): [
    Promise<DiffOutput>,
    Promise<StatusOutput>,
    Promise<Set<string>>
  ] => [
    this.internalCommands.executeCommand<DiffOutput>(
      AvailableCommands.DIFF,
      this.dvcRoot
    ),
    this.internalCommands.executeCommand<StatusOutput>(
      AvailableCommands.STATUS,
      this.dvcRoot
    ),
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
      this.internalCommands.executeCommand<ListOutput[]>(
        AvailableCommands.LIST_DVC_ONLY_RECURSIVE,
        this.dvcRoot
      )
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
    await this.reset()
    return this.deferred.resolve()
  }
}
