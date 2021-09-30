import { join } from 'path'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { Repository } from '.'
import { InternalCommands } from '../commands/internal'
import { TrackedExplorerTree } from '../fileSystem/tree'
import {
  createFileSystemWatcher,
  getRepositoryListener
} from '../fileSystem/watcher'
import { reset } from '../util/disposable'

type Children = Record<string, Repository>

export class Repositories {
  public dispose = Disposable.fn()

  private repositories: Children = {}
  private internalCommands: InternalCommands

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  constructor(internalCommands: InternalCommands) {
    this.internalCommands = internalCommands
  }

  public isReady() {
    return this.initialized
  }

  public create(
    dvcRoots: string[],
    trackedExplorerTree: TrackedExplorerTree
  ): Repository[] {
    const repositories = dvcRoots.map(dvcRoot =>
      this.createRepository(dvcRoot, trackedExplorerTree)
    )

    Promise.all(
      Object.values(this.repositories).map(repo => repo.isReady())
    ).then(() => this.deferred.resolve())

    return repositories
  }

  public reset(): void {
    this.repositories = reset<Children>(this.repositories, this.dispose)
  }

  private createRepository(
    dvcRoot: string,
    trackedExplorerTree: TrackedExplorerTree
  ): Repository {
    const repository = this.dispose.track(
      new Repository(dvcRoot, this.internalCommands)
    )

    repository.dispose.track(
      createFileSystemWatcher(
        join(dvcRoot, '**'),
        getRepositoryListener(repository, trackedExplorerTree)
      )
    )

    this.repositories[dvcRoot] = repository
    return repository
  }
}
