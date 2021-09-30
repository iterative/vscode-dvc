import { join } from 'path'
import { Repository } from '.'
import { TrackedExplorerTree } from '../fileSystem/tree'
import {
  createFileSystemWatcher,
  getRepositoryListener
} from '../fileSystem/watcher'
import { BaseContainer, IContainer } from '../container'

export class Repositories
  extends BaseContainer<Repository>
  implements IContainer<Repository, TrackedExplorerTree>
{
  public create(
    dvcRoots: string[],
    trackedExplorerTree: TrackedExplorerTree
  ): Repository[] {
    const repositories = dvcRoots.map(dvcRoot =>
      this.createRepository(dvcRoot, trackedExplorerTree)
    )

    Promise.all(Object.values(this.contents).map(repo => repo.isReady())).then(
      () => this.deferred.resolve()
    )

    return repositories
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

    this.setRepository(dvcRoot, repository)
    return repository
  }
}
