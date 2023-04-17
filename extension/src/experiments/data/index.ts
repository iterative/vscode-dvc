import { join } from 'path'
import { EventEmitter } from 'vscode'
import { collectFiles } from './collect'
import {
  EXPERIMENTS_GIT_LOGS_REFS,
  EXPERIMENTS_GIT_REFS,
  EXPERIMENTS_GIT_REFS_EXEC
} from './constants'
import { getRelativePattern } from '../../fileSystem/relativePattern'
import { createFileSystemWatcher } from '../../fileSystem/watcher'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { ExpShowOutput } from '../../cli/dvc/contract'
import { BaseData } from '../../data'
import { DOT_DVC, ExperimentFlag } from '../../cli/dvc/constants'
import { gitPath } from '../../cli/git/constants'
import { getGitPath } from '../../fileSystem'
import { ExperimentsModel } from '../model'

export const QUEUED_EXPERIMENT_PATH = join(DOT_DVC, 'tmp', 'exps')

export class ExperimentsData extends BaseData<ExpShowOutput> {
  private readonly experiments: ExperimentsModel

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    experiments: ExperimentsModel
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
      ['dvc.lock', 'dvc.yaml', 'params.yaml', DOT_DVC]
    )

    this.experiments = experiments

    void this.watchExpGitRefs()
    void this.managedUpdate(QUEUED_EXPERIMENT_PATH)
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

  public async update(...args: (ExperimentFlag | string)[]): Promise<void> {
    const flags = this.experiments.getIsBranchesView()
      ? [ExperimentFlag.ALL_BRANCHES]
      : [
          ExperimentFlag.NUM_COMMIT,
          this.experiments.getNbOfCommitsToShow().toString()
        ]
    const data = await this.internalCommands.executeCommand<ExpShowOutput>(
      AvailableCommands.EXP_SHOW,
      this.dvcRoot,
      ...flags,
      ...args
    )

    this.collectFiles(data)

    return this.notifyChanged(data)
  }

  protected collectFiles(data: ExpShowOutput) {
    this.collectedFiles = collectFiles(data, this.collectedFiles)
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

    return createFileSystemWatcher(
      disposable => this.dispose.track(disposable),
      getRelativePattern(dotGitPath, '**'),
      (path: string) => {
        if (path.includes(EXPERIMENTS_GIT_REFS_EXEC)) {
          return
        }

        if (
          watchedRelPaths.some(watchedRelPath => path.includes(watchedRelPath))
        ) {
          return this.managedUpdate(path)
        }
      }
    )
  }
}
