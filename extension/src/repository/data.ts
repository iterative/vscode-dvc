import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { DiffOutput, ListOutput, StatusOutput } from '../cli/reader'
import { isAnyDvcYaml } from '../fileSystem'
import { getAllUntracked } from '../git'
import { ProcessManager } from '../processManager'

export type Data = {
  diffFromHead: DiffOutput
  diffFromCache: StatusOutput
  untracked: Set<string>
  tracked?: ListOutput[]
}

export class RepositoryData {
  public readonly dispose = Disposable.fn()
  public readonly onDidUpdate: Event<Data>

  protected readonly dvcRoot: string

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private readonly processManager: ProcessManager
  private readonly internalCommands: InternalCommands

  private readonly updated: EventEmitter<Data> = this.dispose.track(
    new EventEmitter()
  )

  constructor(dvcRoot: string, internalCommands: InternalCommands) {
    this.dvcRoot = dvcRoot
    this.processManager = this.dispose.track(
      new ProcessManager(
        { name: 'update', process: () => this.updateData() },
        { name: 'reset', process: () => this.resetData() }
      )
    )

    this.internalCommands = internalCommands
    this.onDidUpdate = this.updated.event

    this.initialize()
  }

  public isReady() {
    return this.initialized
  }

  public async managedUpdate(path?: string) {
    await this.isReady()
    if (isAnyDvcYaml(path) || this.processManager.isOngoingOrQueued('reset')) {
      return this.processManager.run('reset')
    }

    return this.processManager.run('update')
  }

  private initialize() {
    const waitForInitialData = this.dispose.track(
      this.onDidUpdate(() => {
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.deferred.resolve()
      })
    )
    return this.resetData()
  }

  private async resetData() {
    const tracked = await this.internalCommands.executeCommand<ListOutput[]>(
      AvailableCommands.LIST_DVC_ONLY_RECURSIVE,
      this.dvcRoot
    )

    const [diffFromHead, diffFromCache, untracked] = await this.getUpdateData()

    return this.notifyChanged({
      diffFromCache,
      diffFromHead,
      tracked,
      untracked
    })
  }

  private async updateData() {
    const [diffFromHead, diffFromCache, untracked] = await this.getUpdateData()
    return this.notifyChanged({ diffFromCache, diffFromHead, untracked })
  }

  private async getUpdateData(): Promise<
    [DiffOutput, StatusOutput, Set<string>]
  > {
    const diffFromCache =
      await this.internalCommands.executeCommand<StatusOutput>(
        AvailableCommands.STATUS,
        this.dvcRoot
      )

    const diffFromHead = await this.internalCommands.executeCommand<DiffOutput>(
      AvailableCommands.DIFF,
      this.dvcRoot
    )

    const untracked = await getAllUntracked(this.dvcRoot)

    return [diffFromHead, diffFromCache, untracked]
  }

  private notifyChanged(data: Data) {
    this.updated.fire(data)
  }
}
