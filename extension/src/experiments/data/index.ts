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
import { Args, DOT_DVC, ExperimentFlag } from '../../cli/dvc/constants'
import { COMMITS_SEPARATOR, gitPath } from '../../cli/git/constants'
import { getGitPath } from '../../fileSystem'
import { ExperimentsModel } from '../model'

export class ExperimentsData extends BaseData<{
  currentBranch: string
  expShow: ExpShowOutput
  order: { branch: string; sha: string }[]
  gitLog: string
}> {
  private readonly experiments: ExperimentsModel

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    experiments: ExperimentsModel
  ) {
    super(
      dvcRoot,
      internalCommands,
      [{ name: 'update', process: () => this.update() }],
      ['dvc.lock', 'dvc.yaml', 'params.yaml', DOT_DVC]
    )

    this.experiments = experiments

    void this.watchExpGitRefs()
    void this.managedUpdate()
    void this.updateAvailableBranchesToSelect()
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public async update(): Promise<void> {
    const allBranches = await this.internalCommands.executeCommand<string[]>(
      AvailableCommands.GIT_GET_BRANCHES,
      this.dvcRoot
    )

    void this.updateAvailableBranchesToSelect(allBranches)

    const { branches, currentBranch } = await this.getBranchesToShowWithCurrent(
      allBranches
    )
    let gitLog = ''
    const order: { branch: string; sha: string }[] = []
    const args: Args = []

    for (const branch of branches) {
      gitLog = await this.collectGitLogAndOrder(gitLog, branch, order, args)
    }

    const expShow = await this.internalCommands.executeCommand<ExpShowOutput>(
      AvailableCommands.EXP_SHOW,
      this.dvcRoot,
      ...args
    )

    this.collectFiles({ expShow })

    return this.notifyChanged({ currentBranch, expShow, gitLog, order })
  }

  protected collectFiles({ expShow }: { expShow: ExpShowOutput }) {
    this.collectedFiles = collectFiles(expShow, this.collectedFiles)
  }

  private async collectGitLogAndOrder(
    gitLog: string,
    branch: string,
    order: { branch: string; sha: string }[],
    args: Args
  ) {
    const nbOfCommitsToShow = this.experiments.getNbOfCommitsToShow(branch)

    const branchGitLog = await this.internalCommands.executeCommand(
      AvailableCommands.GIT_GET_COMMIT_MESSAGES,
      this.dvcRoot,
      branch,
      String(nbOfCommitsToShow)
    )
    gitLog = [gitLog, branchGitLog].join(COMMITS_SEPARATOR)

    for (const commit of branchGitLog.split(COMMITS_SEPARATOR)) {
      const [sha] = commit.split('\n')
      order.push({ branch, sha })
      if (args.includes(sha)) {
        continue
      }
      args.push(ExperimentFlag.REV, sha)
    }
    return gitLog
  }

  private async getBranchesToShowWithCurrent(allBranches: string[]) {
    const currentBranch = await this.internalCommands.executeCommand<string>(
      AvailableCommands.GIT_GET_CURRENT_BRANCH,
      this.dvcRoot
    )

    this.experiments.pruneBranchesToShow(allBranches)

    const branches = [
      currentBranch,
      ...this.experiments
        .getBranchesToShow()
        .filter(branch => branch !== currentBranch)
    ]

    return { branches, currentBranch }
  }

  private async updateAvailableBranchesToSelect(branches?: string[]) {
    const allBranches =
      branches ||
      (await this.internalCommands.executeCommand<string[]>(
        AvailableCommands.GIT_GET_BRANCHES,
        this.dvcRoot
      ))
    this.experiments.setAvailableBranchesToShow(allBranches)
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
          return this.managedUpdate()
        }
      }
    )
  }
}
