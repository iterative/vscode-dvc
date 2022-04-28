import { join } from 'path'
import { EventEmitter } from 'vscode'
import { collectFiles } from './collect'
import {
  EXPERIMENTS_GIT_LOGS_REFS,
  EXPERIMENTS_GIT_REFS,
  EXPERIMENTS_GIT_REFS_EXEC
} from './constants'
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
import { ExperimentFlag } from '../../cli/constants'

export class ExperimentsData extends BaseData<ExperimentsOutput> {
  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>
  ) {
    super(
      dvcRoot,
      internalCommands,
      updatesPaused,
      [
        {
          name: 'partialUpdate',
          process: () => this.update(ExperimentFlag.NO_FETCH)
        },
        { name: 'fullUpdate', process: () => this.update() }
      ],
      ['dvc.lock', 'dvc.yaml', 'params.yaml']
    )

    this.watchExpGitRefs()
    this.managedUpdate(join('.dvc', 'tmp', 'exps'))
  }

  public collectFiles(data: ExperimentsOutput) {
    return collectFiles(data)
  }

  public managedUpdate(path?: string) {
    if (
      path?.includes(join('.dvc', 'tmp', 'exps')) ||
      this.processManager.isOngoingOrQueued('fullUpdate')
    ) {
      return this.processManager.run('fullUpdate')
    }

    return this.processManager.run('partialUpdate')
  }

  public async update(...args: ExperimentFlag[]): Promise<void> {
    const data = await this.internalCommands.executeCommand<ExperimentsOutput>(
      AvailableCommands.EXP_SHOW,
      this.dvcRoot,
      ...args
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
          if (path.includes(EXPERIMENTS_GIT_REFS_EXEC)) {
            return
          }

          if (
            watchedRelPaths.some(watchedRelPath =>
              path.includes(watchedRelPath)
            )
          ) {
            return this.managedUpdate(path)
          }
        }
      )
    )
  }
}
