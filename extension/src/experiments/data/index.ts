import { join } from 'path'
import querystring from 'querystring'
import fetch from 'node-fetch'
import { collectBranches, collectFiles } from './collect'
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
import {
  Args,
  DOT_DVC,
  DVCLIVE_STEP_COMPLETED_SIGNAL_FILE,
  ExperimentFlag,
  TEMP_EXP_DIR
} from '../../cli/dvc/constants'
import { COMMITS_SEPARATOR, gitPath } from '../../cli/git/constants'
import { getGitPath } from '../../fileSystem'
import { ExperimentsModel } from '../model'
import { Studio } from '../studio'
import { STUDIO_URL } from '../../setup/webview/contract'

export class ExperimentsData extends BaseData<ExperimentsOutput> {
  private readonly experiments: ExperimentsModel
  private readonly studio: Studio
  // needs Studio as well but make the request here

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    experiments: ExperimentsModel,
    studio: Studio,
    subProjects: string[]
  ) {
    super(
      dvcRoot,
      internalCommands,
      [{ name: 'update', process: () => this.update() }],
      subProjects,
      [
        'dvc.lock',
        'dvc.yaml',
        'params.yaml',
        DOT_DVC,
        DVCLIVE_STEP_COMPLETED_SIGNAL_FILE
      ]
    )

    this.experiments = experiments
    this.studio = studio

    void this.watchExpGitRefs()
    void this.watchQueueDirectories()
    void this.managedUpdate()
    this.waitForInitialLocalData()
  }

  public managedUpdate() {
    return this.processManager.run('update')
  }

  public async update(): Promise<void> {
    await Promise.all([this.updateExpShow(), this.updateRemoteExpRefs()])
  }

  private async updateExpShow() {
    await this.updateBranches()
    const [currentBranch, ...branches] = this.experiments.getBranchesToShow()
    const availableNbCommits: { [branch: string]: number } = {}

    const promises = []

    promises.push(
      this.collectGitLogByBranch(currentBranch, availableNbCommits, true)
    )

    for (const branch of branches) {
      promises.push(this.collectGitLogByBranch(branch, availableNbCommits))
    }

    const branchLogs = await Promise.all(promises)
    const { args, gitLog, rowOrder } = this.collectGitLogAndOrder(branchLogs)

    return Promise.all([
      this.doExpShow(args, availableNbCommits, gitLog, rowOrder),
      this.doStudio(
        args.filter(arg => (arg as ExperimentFlag) !== ExperimentFlag.REV)
      )
    ])
  }

  private async doExpShow(
    args: Args,
    availableNbCommits: { [branch: string]: number },
    gitLog: string,
    rowOrder: { branch: string; sha: string }[]
  ) {
    const expShow = await this.internalCommands.executeCommand<ExpShowOutput>(
      AvailableCommands.EXP_SHOW,
      this.dvcRoot,
      ...args
    )

    this.notifyChanged({ availableNbCommits, expShow, gitLog, rowOrder })

    this.collectFiles({ expShow })
  }

  private async doStudio(shas: string[]) {
    // return if studio not ready yet as we will call when it becomes ready
    await this.studio.isReady()

    const studioAccessToken = this.studio.getAccessToken()

    if (!studioAccessToken) {
      this.notifyChanged({ baseUrl: null, live: [], pushed: [] })
    }

    const gitRemoteUrl = this.studio.getGitRemoteUrl()

    if (shas.length === 0) {
      this.notifyChanged({ live: [], pushed: [] })
    }

    const params = querystring.stringify({
      commits: [...shas, 'a9d8057e088d46842f15c3b6d1bb2e4befd5f677'],
      git_remote_url: gitRemoteUrl
    })

    try {
      const response = await fetch(`${STUDIO_URL}/api/view-links?${params}`, {
        headers: {
          Authorization: `token ${studioAccessToken}`
        },
        method: 'GET'
      })

      const { live, pushed, view_url } = (await response.json()) as {
        live: { baseline_sha: string; name: string }[]
        pushed: string[]
        view_url: string
      }
      this.notifyChanged({ baseUrl: view_url, live, pushed })
    } catch {
      this.notifyChanged({ live: [], pushed: [] })
    }
  }

  private async collectGitLogByBranch(
    branch: string,
    availableNbCommits: { [branch: string]: number },
    isCurrent?: boolean
  ) {
    const nbOfCommitsToShow = this.experiments.getNbOfCommitsToShow(branch)
    const branchName = isCurrent ? gitPath.DOT_GIT_HEAD : branch

    const [branchLog, totalCommits] = await Promise.all([
      this.internalCommands.executeCommand(
        AvailableCommands.GIT_GET_COMMIT_MESSAGES,
        this.dvcRoot,
        branchName,
        String(nbOfCommitsToShow)
      ),
      this.internalCommands.executeCommand<number>(
        AvailableCommands.GIT_GET_NUM_COMMITS,
        this.dvcRoot,
        branchName
      )
    ])

    availableNbCommits[branch] = totalCommits

    return { branch, branchLog }
  }

  private collectGitLogAndOrder(
    branchLogs: { branch: string; branchLog: string }[]
  ) {
    const rowOrder: { branch: string; sha: string }[] = []
    const args: Args = []
    const gitLog: string[] = []

    for (const { branch, branchLog } of branchLogs) {
      gitLog.push(branchLog)
      for (const commit of branchLog.split(COMMITS_SEPARATOR)) {
        const [sha] = commit.split('\n')
        rowOrder.push({ branch, sha })
        if (args.includes(sha)) {
          continue
        }
        args.push(ExperimentFlag.REV, sha)
      }
    }
    return { args, gitLog: gitLog.join(COMMITS_SEPARATOR), rowOrder }
  }

  private async updateBranches() {
    const allBranches = await this.internalCommands.executeCommand<string[]>(
      AvailableCommands.GIT_GET_BRANCHES,
      this.dvcRoot
    )

    const { currentBranch, branches, branchesToSelect } =
      collectBranches(allBranches)

    this.experiments.setBranches(branches, branchesToSelect, currentBranch)
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

  private watchQueueDirectories() {
    const tempQueueDirectory = join(this.dvcRoot, TEMP_EXP_DIR)
    return createFileSystemWatcher(
      disposable => this.dispose.track(disposable),
      getRelativePattern(tempQueueDirectory, '**'),
      (path: string) => this.listener(path)
    )
  }

  private async updateRemoteExpRefs() {
    const [lsRemoteOutput] = await Promise.all([
      this.internalCommands.executeCommand(
        AvailableCommands.GIT_GET_REMOTE_EXPERIMENT_REFS,
        this.dvcRoot
      ),
      this.isReady()
    ])

    this.notifyChanged({ lsRemoteOutput })
  }

  private waitForInitialLocalData() {
    const waitForInitialData = this.dispose.track(
      this.onDidUpdate(data => {
        if (isRemoteExperimentsOutput(data)) {
          // return early if Studio
          return
        }
        this.dispose.untrack(waitForInitialData)
        waitForInitialData.dispose()
        this.deferred.resolve()
      })
    )
  }
}
