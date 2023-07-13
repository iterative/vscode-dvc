import { EventEmitter, Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import { Experiments, ModifiedExperimentAndRunCommandId } from '.'
import {
  getBranchExperimentCommand,
  getPushExperimentCommand
} from './commands'
import { isCurrentBranch } from './model/collect'
import { TableData } from './webview/contract'
import { Args } from '../cli/dvc/constants'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { Setup } from '../setup'
import { Toast } from '../vscode/toast'
import { getInput, getPositiveIntegerInput } from '../vscode/inputBox'
import { BaseWorkspaceWebviews } from '../webview/workspace'
import { Title } from '../vscode/title'
import { ContextKey, setContextValue } from '../vscode/context'
import { quickPickManyValues } from '../vscode/quickPick'
import { WorkspacePipeline } from '../pipeline/workspace'

export class WorkspaceExperiments extends BaseWorkspaceWebviews<
  Experiments,
  TableData
> {
  public readonly experimentsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  public readonly onDidChangeExperiments = this.experimentsChanged.event

  public readonly columnsChanged = this.dispose.track(new EventEmitter<void>())
  public readonly columnsOrderOrStatusChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  private readonly checkpointsChanged: EventEmitter<void>

  private focusedFileDvcRoot: string | undefined

  constructor(
    internalCommands: InternalCommands,
    workspaceState: Memento,
    experiments?: Record<string, Experiments>,
    checkpointsChanged?: EventEmitter<void>
  ) {
    super(internalCommands, workspaceState, experiments)

    this.checkpointsChanged = this.dispose.track(
      checkpointsChanged || new EventEmitter()
    )
    const onDidChangeCheckpoints = this.checkpointsChanged.event

    this.dispose.track(
      onDidChangeCheckpoints(() => {
        const workspaceHasCheckpoints = Object.values(this.repositories).some(
          experiments => experiments.hasCheckpoints()
        )

        void setContextValue(
          ContextKey.EXPERIMENT_CHECKPOINTS,
          workspaceHasCheckpoints
        )
      })
    )
  }

  public addFilter(overrideRoot?: string) {
    return this.getRepositoryThenUpdate('addFilter', overrideRoot)
  }

  public addStarredFilter(overrideRoot?: string) {
    return this.getRepositoryThenUpdate('addStarredFilter', overrideRoot)
  }

  public removeFilters() {
    return this.getRepositoryThenUpdate('removeFilters')
  }

  public addSort(overrideRoot?: string) {
    return this.getRepositoryThenUpdate('addSort', overrideRoot)
  }

  public addStarredSort(overrideRoot?: string) {
    return this.getRepositoryThenUpdate('addStarredSort', overrideRoot)
  }

  public removeSorts() {
    return this.getRepositoryThenUpdate('removeSorts')
  }

  public selectExperimentsToPlot(overrideRoot?: string) {
    return this.getRepositoryThenUpdate('selectExperimentsToPlot', overrideRoot)
  }

  public selectColumns(overrideRoot?: string) {
    return this.getRepositoryThenUpdate('selectColumns', overrideRoot)
  }

  public async selectExperimentsToStop() {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const ids = await this.getRepository(cwd).pickRunningExperiments()

    if (!ids || isEmpty(ids)) {
      return
    }
    return this.stopExperiments(cwd, ...ids)
  }

  public stopExperiments(dvcRoot: string, ...ids: string[]) {
    return this.getRepository(dvcRoot).stopExperiments(ids)
  }

  public async selectExperimentsToPush(setup: Setup) {
    const dvcRoot = await this.getFocusedOrOnlyOrPickProject()
    if (!dvcRoot) {
      return
    }

    const ids = await this.getRepository(dvcRoot).pickExperimentsToPush()
    if (!ids || isEmpty(ids)) {
      return
    }

    const pushCommand = getPushExperimentCommand(this.internalCommands, setup)

    return pushCommand({ dvcRoot, ids })
  }

  public async selectExperimentsToRemove() {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const ids = await this.getRepository(cwd).pickExperimentsToRemove()

    if (!ids || isEmpty(ids)) {
      return
    }
    return this.runCommand(AvailableCommands.EXP_REMOVE, cwd, ...ids)
  }

  public async modifyWorkspaceParamsAndRun(
    commandId: ModifiedExperimentAndRunCommandId,
    overrideRoot?: string
  ) {
    const { cwd, repository } = await this.getRepositoryAndCwd(overrideRoot)
    if (!(cwd && repository)) {
      return
    }

    return await repository.modifyWorkspaceParamsAndRun(commandId, cwd)
  }

  public async modifyWorkspaceParamsAndQueue(overrideRoot?: string) {
    const { cwd, repository } = await this.getRepositoryAndCwd(overrideRoot)
    if (!(cwd && repository)) {
      return
    }

    return await repository.modifyWorkspaceParamsAndQueue(cwd)
  }

  public async getCwdThenRun(commandId: CommandId) {
    const cwd = await this.getCwd()

    if (!cwd) {
      return 'Could not run task'
    }

    return this.internalCommands.executeCommand(commandId, cwd)
  }

  public getCwdThenReport(commandId: CommandId) {
    return Toast.showOutput(this.getCwdThenRun(commandId))
  }

  public getCwdAndExpNameThenRun(commandId: CommandId) {
    return this.pickExpThenRun(commandId, cwd =>
      this.pickCommitOrExperiment(cwd)
    )
  }

  public async getCwdAndQuickPickThenRun(
    commandId: CommandId,
    quickPick: () => Thenable<string[] | undefined>
  ) {
    const cwd = await this.getCwd()
    if (!cwd) {
      return
    }
    const result = await quickPick()

    if (result) {
      return this.runCommand(commandId, cwd, ...result)
    }
  }

  public async createExperimentBranch() {
    const cwd = await this.getCwd()
    if (!cwd) {
      return
    }

    const experimentId = await this.pickCommitOrExperiment(cwd)

    if (!experimentId) {
      return
    }
    return this.getInputAndRun(
      getBranchExperimentCommand(this),
      Title.ENTER_BRANCH_NAME,
      `${experimentId}-branch`,
      cwd,
      experimentId
    )
  }

  public async getInputAndRun(
    runCommand: (...args: Args) => Promise<void> | void,
    title: Title,
    defaultValue: string,
    ...args: Args
  ) {
    const input = await getInput(title, defaultValue)
    if (!input) {
      return
    }
    return runCommand(...args, input)
  }

  public async getCwdIntegerInputAndRun(
    commandId: CommandId,
    title: Title,
    options: { prompt: string; value: string }
  ) {
    const cwd = await this.getCwd()
    if (!cwd) {
      return
    }

    const integer = await getPositiveIntegerInput(title, options)

    if (!integer) {
      return
    }

    return this.runCommand(commandId, cwd, integer)
  }

  public runCommand(commandId: CommandId, cwd: string, ...args: Args) {
    return Toast.showOutput(
      this.internalCommands.executeCommand(commandId, cwd, ...args)
    )
  }

  public createRepository(
    dvcRoot: string,
    pipeline: WorkspacePipeline,
    resourceLocator: ResourceLocator
  ) {
    const experiments = this.dispose.track(
      new Experiments(
        dvcRoot,
        this.internalCommands,
        pipeline.getRepository(dvcRoot),
        resourceLocator,
        this.workspaceState,
        (branchesSelected: string[]) => this.selectBranches(branchesSelected)
      )
    )

    this.setRepository(dvcRoot, experiments)

    experiments.dispose.track(
      experiments.onDidChangeIsWebviewFocused(
        dvcRoot => (this.focusedWebviewDvcRoot = dvcRoot)
      )
    )

    experiments.dispose.track(
      experiments.onDidChangeIsExperimentsFileFocused(
        dvcRoot => (this.focusedFileDvcRoot = dvcRoot)
      )
    )

    experiments.dispose.track(
      experiments.onDidChangeExperiments(() => {
        this.experimentsChanged.fire()
      })
    )

    experiments.dispose.track(
      experiments.onDidChangeColumns(() => {
        this.columnsChanged.fire()
      })
    )

    experiments.dispose.track(
      experiments.onDidChangeColumnOrderOrStatus(() => {
        this.experimentsChanged.fire()
      })
    )

    experiments.dispose.track(
      experiments.onDidChangeCheckpoints(() => {
        this.checkpointsChanged.fire()
      })
    )

    return experiments
  }

  public getFocusedOrOnlyOrPickProject() {
    return (
      this.focusedWebviewDvcRoot ||
      this.focusedFileDvcRoot ||
      this.getOnlyOrPickProject()
    )
  }

  public getHasData() {
    const allLoading = undefined

    const repositories = Object.values(this.repositories)

    if (repositories.some(repository => repository.getHasData())) {
      return true
    }

    if (repositories.some(repository => repository.getHasData() === false)) {
      return false
    }

    return allLoading
  }

  public getCliError() {
    const repositories = Object.values(this.repositories)
    const errors = []
    for (const repository of repositories) {
      const cliError = repository.getCliError()
      if (!cliError) {
        continue
      }
      errors.push(cliError)
    }
    return errors.length > 0 ? errors.join('\n') : undefined
  }

  public hasRunningExperiment() {
    return Object.values(this.repositories).some(experiments =>
      experiments.hasRunningExperiment()
    )
  }

  public async selectBranches(branchesSelected: string[]) {
    const cwd = await this.getDvcRoot()
    if (!cwd) {
      return
    }
    const allBranches = await this.internalCommands.executeCommand<string[]>(
      AvailableCommands.GIT_GET_BRANCHES,
      cwd
    )
    return await quickPickManyValues(
      allBranches
        .filter(branch => !isCurrentBranch(branch))
        .map(branch => {
          return {
            label: branch,
            picked: branchesSelected.includes(branch),
            value: branch
          }
        }),
      {
        title: Title.SELECT_BRANCHES
      }
    )
  }

  private async getRepositoryThenUpdate(
    method:
      | 'addFilter'
      | 'addStarredFilter'
      | 'removeFilters'
      | 'addSort'
      | 'addStarredSort'
      | 'removeSorts'
      | 'selectExperimentsToPlot'
      | 'selectColumns',
    overrideRoot?: string
  ) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot)[method]()
  }

  private async getRepositoryAndCwd(overrideRoot?: string) {
    const project = await this.getDvcRoot(overrideRoot)
    if (!project) {
      return { cwd: undefined, repository: undefined }
    }
    const repository = this.getRepository(project)
    const cwd = await repository.getPipelineCwd()
    return { cwd, repository }
  }

  private async getCwd(overrideRoot?: string) {
    const { cwd } = await this.getRepositoryAndCwd(overrideRoot)
    return cwd
  }

  private async pickExpThenRun(
    commandId: CommandId,
    pickFunc: (cwd: string) => Thenable<string | undefined> | undefined
  ) {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experimentId = await pickFunc(cwd)

    if (!experimentId) {
      return
    }
    return this.runCommand(commandId, cwd, experimentId)
  }

  private pickCommitOrExperiment(cwd: string) {
    return this.getRepository(cwd).pickCommitOrExperiment()
  }
}
