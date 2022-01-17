import { EventEmitter, Event } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { ProcessManager } from '../processManager'
import { InternalCommands } from '../commands/internal'
import { ExperimentsOutput } from '../cli/reader'
import { PlotsOutput } from '../plots/webview/contract'

export abstract class BaseData<T extends PlotsOutput | ExperimentsOutput> {
  public readonly dispose = Disposable.fn()
  public readonly onDidUpdate: Event<T>

  protected readonly dvcRoot: string
  protected readonly processManager: ProcessManager
  protected readonly internalCommands: InternalCommands
  protected readonly deferred = new Deferred()

  private readonly initialized = this.deferred.promise

  private readonly updated: EventEmitter<T> = this.dispose.track(
    new EventEmitter()
  )

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
  ) {
    this.dvcRoot = dvcRoot
    this.processManager = this.dispose.track(
      new ProcessManager(updatesPaused, {
        name: 'update',
        process: () => this.update()
      })
    )

    this.internalCommands = internalCommands
    this.onDidUpdate = this.updated.event
  }

  public isReady() {
    return this.initialized
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  protected notifyChanged(data: T) {
    this.updated.fire(data)
  }

  abstract update(): Promise<unknown>
}
