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
import {
  BaseData,
  ExperimentsOutput,
  isRemoteExperimentsOutput
} from '../../data'
import { Args, DOT_DVC, ExperimentFlag } from '../../cli/dvc/constants'
import { COMMITS_SEPARATOR, gitPath } from '../../cli/git/constants'
import { getGitPath } from '../../fileSystem'
import { ExperimentsModel } from '../model'

export class ExperimentsData extends BaseData<ExperimentsOutput> {
  private readonly experiments: ExperimentsModel

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    experiments: ExperimentsModel,
    subProjects: string[]
  ) {
    super(
      dvcRoot,
      internalCommands,
      [{ name: 'update', process: () => this.update() }],
      subProjects,
      ['dvc.lock', 'dvc.yaml', 'params.yaml', DOT_DVC]
    )

    this.experiments = experiments

    void this.watchExpGitRefs()
    void this.managedUpdate()
    this.waitForInitialLocalData()
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public async update(): Promise<void> {
    await Promise.all([
      this.notifyChanged(await this.updateExpShow()),
      this.notifyChanged(await this.updateRemoteExpRefs())
    ])
  }

  private async updateExpShow() {
    await this.updateBranches()
    const branches = this.experiments.getBranchesToShow()
    let gitLog = ''
    const rowOrder: { branch: string; sha: string }[] = []
    const availableNbCommits: { [branch: string]: number } = {}
    const args: Args = []

    for (const branch of branches) {
      gitLog = await this.collectGitLogAndOrder(
        gitLog,
        branch,
        rowOrder,
        availableNbCommits,
        args
      )
    }

    const expShow = await this.internalCommands.executeCommand<ExpShowOutput>(
      AvailableCommands.EXP_SHOW,
      this.dvcRoot,
      ...args
    )

    this.collectFiles({ expShow })
    return { availableNbCommits, expShow, gitLog, rowOrder }
  }

  private async collectGitLogAndOrder(
    gitLog: string,
    branch: string,
    rowOrder: { branch: string; sha: string }[],
    availableNbCommits: { [branch: string]: number },
    args: Args
  ) {
    const nbOfCommitsToShow = this.experiments.getNbOfCommitsToShow(branch)

    const [branchGitLog, totalCommits] = await Promise.all([
      this.internalCommands.executeCommand(
        AvailableCommands.GIT_GET_COMMIT_MESSAGES,
        this.dvcRoot,
        branch,
        String(nbOfCommitsToShow)
      ),
      this.internalCommands.executeCommand<number>(
        AvailableCommands.GIT_GET_NUM_COMMITS,
        this.dvcRoot,
        branch
      )
    ])
    gitLog = [gitLog, branchGitLog].join(COMMITS_SEPARATOR)
    availableNbCommits[branch] = totalCommits

    for (const commit of branchGitLog.split(COMMITS_SEPARATOR)) {
      const [sha] = commit.split('\n')
      rowOrder.push({ branch, sha })
      if (args.includes(sha)) {
        continue
      }
      args.push(ExperimentFlag.REV, sha)
    }
    return gitLog
  }

  private async updateBranches() {
    const allBranches = await this.internalCommands.executeCommand<string[]>(
      AvailableCommands.GIT_GET_BRANCHES,
      this.dvcRoot
    )

    this.experiments.setBranches(allBranches)
  }

  private collectFiles({ expShow }: { expShow: ExpShowOutput }) {
    this.collectedFiles = collectFiles(expShow, this.collectedFiles)
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

  private async updateRemoteExpRefs() {
    const [remoteExpRefs] = await Promise.all([
      this.internalCommands.executeCommand(
        AvailableCommands.GIT_GET_REMOTE_EXPERIMENT_REFS,
        this.dvcRoot
      ),
      this.isReady()
    ])
    return { remoteExpRefs }
  }

  private waitForInitialLocalData() {
    const waitForInitialData = this.dispose.track(
      this.onDidUpdate(data => {
        if (isRemoteExperimentsOutput(data)) {
          return
        }
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.deferred.resolve()
      })
    )
  }
}
