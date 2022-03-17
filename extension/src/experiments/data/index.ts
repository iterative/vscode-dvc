import { join } from 'path'
import { EventEmitter } from 'vscode'
import { collectFiles } from './collect'
import { EXPERIMENTS_GIT_LOGS_REFS, EXPERIMENTS_GIT_REFS } from './constants'
import {
  createFileSystemWatcher,
  getRelativePattern
} from '../../fileSystem/watcher'
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
    super(dvcRoot, internalCommands, updatesPaused, [
      'dvc.lock',
      'dvc.yaml',
      'params.yaml'
    ])

    this.watchExpGitRefs()
    this.managedUpdate()
  }

  public collectFiles(data: ExperimentsOutput) {
    return collectFiles(data)
  }

  public async update(): Promise<void> {
    const data = await this.internalCommands.executeCommand<ExperimentsOutput>(
      AvailableCommands.EXPERIMENT_SHOW,
      this.dvcRoot
    )

    const files = this.collectFiles(data)

    this.compareFiles(files)

    return this.notifyChanged(data)
  }

  public forceUpdate() {
    return this.processManager.forceRunQueued()
  }

  private async watchExpGitRefs(): Promise<void> {
    const gitRoot = await getGitRepositoryRoot(this.dvcRoot)
    const watchedRelPaths = [
      DOT_GIT_HEAD,
      EXPERIMENTS_GIT_REFS,
      EXPERIMENTS_GIT_LOGS_REFS,
      HEADS_GIT_REFS
    ]

    this.dispose.track(
      createFileSystemWatcher(
        getRelativePattern(join(gitRoot, DOT_GIT), '**'),
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
