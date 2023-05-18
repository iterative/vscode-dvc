import { getOnlyOrPickProject } from './util'
import { InternalCommands } from '../commands/internal'
import { Disposables, reset } from '../util/disposable'
import { DeferredDisposable } from '../class/deferred'

export abstract class BaseWorkspace<
  T extends DeferredDisposable,
  U = undefined
> extends DeferredDisposable {
  protected repositories: Disposables<T> = {}
  protected readonly internalCommands: InternalCommands

  constructor(internalCommands: InternalCommands) {
    super()

    this.internalCommands = internalCommands
  }

  public create(dvcRoots: string[], ...args: U[]): T[] {
    const repositories = dvcRoots.map(dvcRoot =>
      this.createRepository(dvcRoot, ...args)
    )

    void Promise.all(repositories.map(repository => repository.isReady())).then(
      () => this.deferred.resolve()
    )

    return repositories
  }

  public getDvcRoots() {
    return Object.keys(this.repositories)
  }

  public reset(): void {
    this.repositories = reset<T>(this.repositories, (disposable: T) =>
      this.dispose.untrack(disposable)
    )
    this.resetDeferred()
  }

  public getOnlyOrPickProject() {
    const dvcRoots = this.getDvcRoots()
    return getOnlyOrPickProject(dvcRoots)
  }

  public getRepository(dvcRoot: string) {
    return this.repositories[dvcRoot]
  }

  protected setRepository(dvcRoot: string, repository: T) {
    this.repositories[dvcRoot] = repository
  }

  abstract createRepository(dvcRoot: string, ...args: U[]): T
}
