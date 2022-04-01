import { EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { InternalCommands } from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { Disposables, reset } from '../util/disposable'
import { quickPickOne } from '../vscode/quickPick'
import { BaseDeferredClass } from '../class'

export abstract class BaseWorkspace<
  T extends Disposable & { isReady: () => Promise<void> },
  U extends ResourceLocator | undefined = undefined
> extends BaseDeferredClass {
  protected repositories: Disposables<T> = {}
  protected readonly internalCommands: InternalCommands

  constructor(internalCommands: InternalCommands) {
    super()

    this.internalCommands = internalCommands
  }

  public create(
    dvcRoots: string[],
    updatesPaused: EventEmitter<boolean>,
    optional?: U
  ): T[] {
    const repositories = dvcRoots.map(dvcRoot =>
      this.createRepository(dvcRoot, updatesPaused, optional)
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

  abstract createRepository(
    dvcRoot: string,
    updatesPaused: EventEmitter<boolean>,
    arg?: U
  ): T
}
