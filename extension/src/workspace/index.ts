import { Disposable, Disposer } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { InternalCommands } from '../commands/internal'
import { Disposables, reset } from '../util/disposable'
import { quickPickOne } from '../vscode/quickPick'

export interface IWorkspace<T, U> {
  create: (dvcRoots: string[], arg: U) => T[]
  dispose: (() => void) & Disposer
  getDvcRoots: () => string[]
  getOnlyOrPickProject: () => Promise<string | undefined>
  isReady: () => Promise<void>
  reset: () => void
}

export class BaseWorkspace<T extends Disposable> {
  public dispose = Disposable.fn()

  protected repositories: Disposables<T> = {}
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

  public async getOnlyOrPickProject() {
    const dvcRoots = this.getDvcRoots()

    if (dvcRoots.length === 1) {
      return dvcRoots[0]
    }

    return await quickPickOne(
      dvcRoots,
      'Select which project to run command against'
    )
  }

  protected getRepository(dvcRoot: string) {
    return this.repositories[dvcRoot]
  }

  protected setRepository(dvcRoot: string, repository: T) {
    this.repositories[dvcRoot] = repository
  }
}
