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
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { ExperimentsOutput } from '../../cli/dvc/contract'
import { BaseData } from '../../data'
import { ExperimentFlag } from '../../cli/dvc/constants'
import { gitPath } from '../../cli/git/constants'
import { getGitPath } from '../../fileSystem'

export const QUEUED_EXPERIMENT_PATH = join('.dvc', 'tmp', 'exps')

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
      ['dvc.lock', 'dvc.yaml', 'params.yaml', '*.dvc']
    )

    this.watchExpGitRefs()
    this.managedUpdate(QUEUED_EXPERIMENT_PATH)
  }

  public managedUpdate(path?: string) {
    if (
      path?.includes(QUEUED_EXPERIMENT_PATH) ||
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

  protected collectFiles(data: ExperimentsOutput) {
    return collectFiles(data, this.collectedFiles)
  }

  private async watchExpGitRefs(): Promise<void> {
    const gitRoot = await this.internalCommands.executeCommand(
      AvailableCommands.GIT_GET_REPOSITORY_ROOT,
      this.dvcRoot
    )

    const dotGitPath = getGitPath(gitRoot, gitPath.DOT_GIT)
    const watchedRelPaths = [
      gitPath.DOT_GIT_HEAD,
      EXPERIMENTS_GIT_REFS,
      EXPERIMENTS_GIT_LOGS_REFS,
      gitPath.HEADS_GIT_REFS
    ]

    this.dispose.track(
      createFileSystemWatcher(
        getRelativePattern(dotGitPath, '**'),
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
