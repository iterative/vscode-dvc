import { join } from 'path'
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
    this.dispose.track(
      createNecessaryFileSystemWatcher(
        join(gitRoot, DOT_GIT),
        ['HEAD', join('refs', 'exps'), join('refs', 'heads')],
        (path: string) => {
          if (
            path.includes(DOT_GIT_HEAD) ||
            path.includes(EXPERIMENTS_GIT_REFS) ||
            path.includes(HEADS_GIT_REFS)
          ) {
            return this.managedUpdate()
          }
        }
      )
    )
  }
}
