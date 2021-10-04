import { join } from 'path'
import { Repository } from '.'
import { TrackedExplorerTree } from '../fileSystem/tree'
import {
  createFileSystemWatcher,
  getRepositoryListener
} from '../fileSystem/watcher'
import { BaseWorkspace, IWorkspace } from '../workspace'

export class WorkspaceRepositories
  extends BaseWorkspace<Repository>
  implements IWorkspace<Repository, TrackedExplorerTree>
{
  public create(
    dvcRoots: string[],
    trackedExplorerTree: TrackedExplorerTree
  ): Repository[] {
    const repositories = dvcRoots.map(dvcRoot =>
      this.createRepository(dvcRoot, trackedExplorerTree)
    )

    Promise.all(repositories.map(repository => repository.isReady())).then(() =>
      this.deferred.resolve()
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
