import { join } from 'path'
import { EventEmitter } from 'vscode'
import { collectFiles } from './collect'
import {
  DOT_GIT,
  DOT_GIT_HEAD,
  EXPERIMENTS_GIT_REFS,
  HEADS_GIT_REFS
} from './constants'
import {
  createExpensiveWatcher,
  createFileSystemWatcher
} from '../../fileSystem/watcher'
import { getGitRepositoryRoot } from '../../git'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { ExperimentsOutput } from '../../cli/reader'
import { BaseData } from '../../data'
import { isInWorkspace } from '../../fileSystem/workspace'

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
    const listener = (path: string) => {
      if (
        path.includes(DOT_GIT_HEAD) ||
        path.includes(EXPERIMENTS_GIT_REFS) ||
        path.includes(HEADS_GIT_REFS)
      ) {
        return this.managedUpdate()
      }
    }
    const canUseNative = isInWorkspace(gitRoot)
    const fileSystemWatcher = canUseNative
      ? createFileSystemWatcher(join(gitRoot, DOT_GIT, '**'), listener)
      : createExpensiveWatcher(
          [
            join(gitRoot, DOT_GIT_HEAD),
            join(gitRoot, EXPERIMENTS_GIT_REFS),
            join(gitRoot, HEADS_GIT_REFS)
          ],
          listener
        )
    this.dispose.track(fileSystemWatcher)
  }
}
