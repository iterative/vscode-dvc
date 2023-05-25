import { collectFiles } from './collect'
import {
  EXPERIMENTS_GIT_LOGS_REFS,
  EXPERIMENTS_GIT_REFS,
  EXPERIMENTS_GIT_REFS_EXEC
} from './constants'
import { getRelativePattern } from '../../fileSystem/relativePattern'
import { createFileSystemWatcher } from '../../fileSystem/watcher'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { EXPERIMENT_WORKSPACE_ID, ExpShowOutput } from '../../cli/dvc/contract'
import { BaseData } from '../../data'
import { DOT_DVC, ExperimentFlag } from '../../cli/dvc/constants'
import { gitPath } from '../../cli/git/constants'
import { getGitPath } from '../../fileSystem'
import { ExperimentsModel } from '../model'
import { formatCommitMessage, getCommitDataFromOutput } from '../model/collect'
import { CommitData } from '../webview/contract'

interface HashInfo extends CommitData {
  branches: string[]
}

export class ExperimentsData extends BaseData<ExpShowOutput> {
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

    const flags = []
    const hashes: Record<string, HashInfo> = {}

    for (const branch of branches) {
      const nbOfCommitsToShow = this.experiments.getNbOfCommitsToShow(branch)

      for (let i = 0; i < nbOfCommitsToShow; i++) {
        const revision = `${branch}~${i}`

        const commitDataOutput = await this.internalCommands.executeCommand(
          AvailableCommands.GIT_GET_COMMIT_MESSAGES,
          this.dvcRoot,
          revision
        )

        const { hash, ...commitData } =
          getCommitDataFromOutput(commitDataOutput)
        if (hashes[hash]) {
          hashes[hash].branches.push(branch)
        } else {
          hashes[hash] = {
            branches: [branch],
            ...commitData
          }
        }

        flags.push(ExperimentFlag.REV, revision)
      }
    }

    const output = await this.internalCommands.executeCommand<ExpShowOutput>(
      AvailableCommands.EXP_SHOW,
      this.dvcRoot,
      ...flags
    )

    const data: ExpShowOutput = []
    for (const out of output) {
      if (out.rev === EXPERIMENT_WORKSPACE_ID) {
        data.push({ ...out, branch: currentBranch })
      } else {
        const revision = hashes[out.rev]
        const { branches, ...commit } = revision
        for (const branch of branches) {
          data.push({
            ...out,
            commit,
            description: formatCommitMessage(commit.message),
            branch
          })
        }
      }
    }

    this.collectFiles(data)

    return this.notifyChanged(data)
  }

  protected collectFiles(data: ExpShowOutput) {
    this.collectedFiles = collectFiles(data, this.collectedFiles)
  }

  private async getBranchesToShowWithCurrent(allBranches: string[]) {
    const currentBranch = await this.internalCommands.executeCommand<string>(
      AvailableCommands.GIT_GET_CURRENT_BRANCH,
      this.dvcRoot
    )

    this.experiments.pruneBranchesToShow(allBranches)

    const branches = this.experiments.getBranchesToShow()

    if (!branches.includes(currentBranch)) {
      branches.push(currentBranch)
      this.experiments.setBranchesToShow(branches)
    }

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
