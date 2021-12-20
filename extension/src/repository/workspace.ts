import { join } from 'path'
import { EventEmitter, Uri } from 'vscode'
import { Repository } from '.'
import { DOT_GIT_HEAD, DOT_GIT_INDEX } from '../experiments/data/constants'
import {
  createExpensiveWatcher,
  createFileSystemWatcher,
  getRepositoryListener
} from '../fileSystem/watcher'
import { isInWorkspace } from '../fileSystem/workspace'
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

    this.setupWatchers(dvcRoot, repository)

    this.setRepository(dvcRoot, repository)
    return repository
  }

  private hasChanges(dvcRoot: string) {
    return this.getRepository(dvcRoot).hasChanges()
  }

  private setupWatchers(dvcRoot: string, repository: Repository) {
    repository.dispose.track(
      createFileSystemWatcher(
        join(dvcRoot, '**'),
        getRepositoryListener(repository, dvcRoot)
      )
    )

    getGitRepositoryRoot(dvcRoot).then(gitRoot => {
      const canUseNative = isInWorkspace(gitRoot)
      const fileSystemWatcher = canUseNative
        ? createFileSystemWatcher(
            join(gitRoot, '.git', '{index,HEAD}'),
            getRepositoryListener(repository, dvcRoot)
          )
        : createExpensiveWatcher(
            [join(gitRoot, DOT_GIT_INDEX), join(gitRoot, DOT_GIT_HEAD)],
            getRepositoryListener(repository, dvcRoot)
          )
      repository.dispose.track(fileSystemWatcher)
    })
  }
}
