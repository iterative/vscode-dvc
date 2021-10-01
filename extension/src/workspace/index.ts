import { Disposable, Disposer } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { Disposables, reset } from '../util/disposable'

export interface IWorkspace<T, U> {
  create: (dvcRoots: string[], arg: U) => T[]
  dispose: (() => void) & Disposer
  getDvcRoots: () => string[]
  isReady: () => Promise<void>
  reset: () => void
}

export class BaseWorkspace<T extends Disposable> {
  public dispose = Disposable.fn()

  protected repositories: Disposables<T> = {}
  protected dvcRoots = []
  protected internalCommands: InternalCommands

  protected readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(internalCommands: InternalCommands) {
    this.internalCommands = internalCommands
  }

  public isReady() {
    return this.initialized
  }

  public getDvcRoots() {
    return Object.keys(this.repositories)
  }

  public reset(): void {
    this.repositories = reset<T>(this.repositories, this.dispose)
  }

  protected getOnlyOrPickProject() {
    return this.internalCommands.executeCommand<string | undefined>(
      AvailableCommands.GET_ONLY_OR_PICK_PROJECT,
      ...this.getDvcRoots()
    )
  }

  protected getRepository(dvcRoot: string) {
    return this.repositories[dvcRoot]
  }

  protected setRepository(dvcRoot: string, repository: T) {
    this.repositories[dvcRoot] = repository
  }
}
