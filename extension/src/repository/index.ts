import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { observable, makeObservable } from 'mobx'
import { SourceControlManagement } from './sourceControlManagement'
import { DecorationProvider } from './decorationProvider'
import { RepositoryModel } from './model'
import { ListOutput, DiffOutput, StatusOutput } from '../cli/reader'
import { getAllUntracked } from '../git'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { ProcessManager } from '../processManager'
export class Repository {
  @observable
  private model: RepositoryModel

  public readonly dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands
  private decorationProvider: DecorationProvider
  private readonly sourceControlManagement: SourceControlManagement

  private processManager: ProcessManager

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    decorationProvider = new DecorationProvider()
  ) {
    makeObservable(this)
    this.internalCommands = internalCommands
    this.decorationProvider = this.dispose.track(decorationProvider)
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

  public hasChanges(): boolean {
    return this.model.hasChanges()
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

  private async getUpdateData(): Promise<
    [DiffOutput, StatusOutput, Set<string>]
  > {
    const statusOutput =
      await this.internalCommands.executeCommand<StatusOutput>(
        AvailableCommands.STATUS,
        this.dvcRoot
      )

    const diffOutput = await this.internalCommands.executeCommand<DiffOutput>(
      AvailableCommands.DIFF,
      this.dvcRoot
    )

    const gitOutput = await getAllUntracked(this.dvcRoot)

    return [diffOutput, statusOutput, gitOutput]
  }

  private async getResetData(): Promise<
    [DiffOutput, StatusOutput, Set<string>, ListOutput[]]
  > {
    const listOutput = await this.internalCommands.executeCommand<ListOutput[]>(
      AvailableCommands.LIST_DVC_ONLY_RECURSIVE,
      this.dvcRoot
    )

    const [diffOutput, statusOutput, gitOutput] = await this.getUpdateData()

    return [diffOutput, statusOutput, gitOutput, listOutput]
  }

  private setState() {
    this.sourceControlManagement.setState(this.getState())
    this.decorationProvider.setState(this.getState())
  }

  private async setup() {
    await this.reset()
    return this.deferred.resolve()
  }
}
