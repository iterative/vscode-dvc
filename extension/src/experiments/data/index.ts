import { join, relative } from 'path'
import { EventEmitter } from 'vscode'
import { collectFiles } from './collect'
import { EXPERIMENTS_GIT_REFS } from './constants'
import { createNecessaryFileSystemWatcher } from '../../fileSystem/watcher'
import {
  DOT_GIT,
  DOT_GIT_HEAD,
  HEADS_GIT_REFS,
  getGitRepositoryRoot
} from '../../git'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { ExperimentsOutput } from '../../cli/reader'
import { BaseData } from '../../data'

export class ExperimentsData extends BaseData<ExperimentsOutput> {
  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
  ) {
    super(
      dvcRoot,
      internalCommands,
      AvailableCommands.EXPERIMENT_SHOW,
      updatesPaused,
      ['dvc.lock', 'dvc.yaml', 'params.yaml']
    )

    this.watchExpGitRefs()
  }

  public collectFiles(data: ExperimentsOutput) {
    return collectFiles(data)
  }

  public forceUpdate() {
    return this.processManager.forceRunQueued()
  }

  private async watchExpGitRefs(): Promise<void> {
    const gitRoot = await getGitRepositoryRoot(this.dvcRoot)
    const watchedRelPaths = [DOT_GIT_HEAD, EXPERIMENTS_GIT_REFS, HEADS_GIT_REFS]
    this.dispose.track(
      createNecessaryFileSystemWatcher(
        join(gitRoot, DOT_GIT),
        watchedRelPaths.map(path => relative(DOT_GIT, path)),
        (path: string) => {
          if (
            watchedRelPaths.some(watchedRelPath =>
              path.includes(watchedRelPath)
            )
          ) {
            return this.managedUpdate()
          }
        }
      )
    )
  }
}
