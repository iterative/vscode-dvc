import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { InternalCommands } from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { Disposables, reset } from '../util/disposable'
import { quickPickOne } from '../vscode/quickPick'

export abstract class BaseWorkspace<
  T extends Disposable & { isReady: () => Promise<void> },
  U extends ResourceLocator | undefined = undefined
> {
  public readonly dispose = Disposable.fn()

  protected repositories: Disposables<T> = {}
  protected readonly internalCommands: InternalCommands

  protected readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(internalCommands: InternalCommands) {
    this.internalCommands = internalCommands
  }

  public isReady() {
    return this.initialized
  }

  public create(dvcRoots: string[], optional?: U): T[] {
    const repositories = dvcRoots.map(dvcRoot =>
      this.createRepository(dvcRoot, optional)
    )

    Promise.all(repositories.map(repository => repository.isReady())).then(() =>
      this.deferred.resolve()
    )

    return repositories
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

  public getRepository(dvcRoot: string) {
    return this.repositories[dvcRoot]
  }

  protected setRepository(dvcRoot: string, repository: T) {
    this.repositories[dvcRoot] = repository
  }

  abstract createRepository(dvcRoot: string, arg?: U): T
}
