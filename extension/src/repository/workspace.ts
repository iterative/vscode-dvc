import { join } from 'path'
import { EventEmitter, Uri } from 'vscode'
import { Repository } from '.'
import {
  createNecessaryFileSystemWatcher,
  getRepositoryListener
} from '../fileSystem/watcher'
import { getGitRepositoryRoot } from '../git'
import { BaseWorkspace } from '../workspace'

export class WorkspaceRepositories extends BaseWorkspace<Repository> {
  public readonly treeDataChanged = this.dispose.track(new EventEmitter<void>())

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

  public createRepository(
    dvcRoot: string,
    updatesPaused: EventEmitter<boolean>
  ): Repository {
    const repository = this.dispose.track(
      new Repository(
        dvcRoot,
        this.internalCommands,
        updatesPaused,
        this.treeDataChanged
      )
    )
    getGitRepositoryRoot(dvcRoot).then(gitRoot =>
      repository.dispose.track(
        createNecessaryFileSystemWatcher(
          join(gitRoot, '**'),
          getRepositoryListener(repository, dvcRoot)
        )
      )
    )

    this.setRepository(dvcRoot, repository)
    return repository
  }

  private hasChanges(dvcRoot: string) {
    return this.getRepository(dvcRoot).hasChanges()
  }
}
