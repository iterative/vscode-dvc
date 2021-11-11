import { join } from 'path'
import { EventEmitter, Uri } from 'vscode'
import { Repository } from '.'
import { PathItem } from './collect'
import {
  createNecessaryFileSystemWatcher,
  getRepositoryListener
} from '../fileSystem/watcher'
import { getGitRepositoryRoot } from '../git'
import { BaseWorkspace, IWorkspace } from '../workspace'

export class WorkspaceRepositories
  extends BaseWorkspace<Repository>
  implements IWorkspace<Repository, undefined>
{
  public treeDataChanged = new EventEmitter<PathItem | void>()

  public getCwd(overrideUri?: Uri): string | Promise<string | undefined> {
    return overrideUri?.fsPath || this.getOnlyOrPickProject()
  }

  public async getCwdWithChanges(overrideUri?: Uri) {
    const cwd = await this.getCwd(overrideUri)
    if (!cwd) {
      return
    }
    const changes = this.hasChanges(cwd)

    if (!changes) {
      return
    }

    return cwd
  }

  public create(dvcRoots: string[]): Repository[] {
    const repositories = dvcRoots.map(dvcRoot => this.createRepository(dvcRoot))

    Promise.all(repositories.map(repository => repository.isReady())).then(() =>
      this.deferred.resolve()
    )

    return repositories
  }

  private createRepository(dvcRoot: string): Repository {
    const repository = this.dispose.track(
      new Repository(dvcRoot, this.internalCommands)
    )
    getGitRepositoryRoot(dvcRoot).then(gitRoot =>
      repository.dispose.track(
        createNecessaryFileSystemWatcher(
          join(gitRoot, '**'),
          getRepositoryListener(repository, dvcRoot)
        )
      )
    )
    repository.dispose.track(
      repository.onDidChangeTreeData(() =>
        this.treeDataChanged.fire({
          dvcRoot,
          isDirectory: true,
          resourceUri: Uri.file(dvcRoot)
        })
      )
    )

    this.setRepository(dvcRoot, repository)
    return repository
  }

  private hasChanges(dvcRoot: string) {
    return this.getRepository(dvcRoot).hasChanges()
  }
}
