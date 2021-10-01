import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { Disposables, reset } from '../util/disposable'

export interface IContainer<T, U> {
  create: (dvcRoots: string[], arg: U) => T[]
}

export class BaseContainer<T extends Disposable> {
  public dispose = Disposable.fn()

  protected contents: Disposables<T> = {}
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
    return Object.keys(this.contents)
  }

  public reset(): void {
    this.contents = reset<T>(this.contents, this.dispose)
  }

  protected getOnlyOrPickProject() {
    return this.internalCommands.executeCommand<string | undefined>(
      AvailableCommands.GET_ONLY_OR_PICK_PROJECT,
      ...this.getDvcRoots()
    )
  }

  protected getRepository(dvcRoot: string) {
    return this.contents[dvcRoot]
  }

  protected setRepository(dvcRoot: string, repository: T) {
    this.contents[dvcRoot] = repository
  }
}
