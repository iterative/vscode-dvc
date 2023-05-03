import { EventEmitter, Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import { Experiments, ModifiedExperimentAndRunCommandId } from '.'
import { getPushExperimentCommand } from './commands'
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
import {
  getInput,
  getPositiveIntegerInput,
  getValidInput
} from '../vscode/inputBox'
import { BaseWorkspaceWebviews } from '../webview/workspace'
import { Title } from '../vscode/title'
import { ContextKey, setContextValue } from '../vscode/context'
import {
  findOrCreateDvcYamlFile,
  getFileExtension,
  hasDvcYamlFile
} from '../fileSystem'
import { quickPickManyValues, quickPickOneOrInput } from '../vscode/quickPick'
import { pickFile } from '../vscode/resourcePicker'

export enum scriptCommand {
  JUPYTER = 'jupyter nbconvert --to notebook --inplace --execute',
  PYTHON = 'python'
}

export const getScriptCommand = (script: string) => {
  switch (getFileExtension(script)) {
    case '.py':
      return scriptCommand.PYTHON
    case '.ipynb':
      return scriptCommand.JUPYTER
    default:
      return ''
  }
}

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

  private focusedParamsDvcRoot: string | undefined

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

  public selectQueueTasksToKill() {
    return this.pickIdsThenRun(
      'pickQueueTasksToKill',
      AvailableCommands.QUEUE_KILL
    )
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

  public selectExperimentsToRemove() {
    return this.pickIdsThenRun(
      'pickExperimentsToRemove',
      AvailableCommands.EXP_REMOVE
    )
  }

  public async modifyExperimentParamsAndRun(
    commandId: ModifiedExperimentAndRunCommandId,
    overrideRoot?: string,
    overrideId?: string
  ) {
    const cwd = await this.getDvcRoot(overrideRoot)
    if (!cwd) {
      return
    }

    const repository = this.getRepository(cwd)
    if (!repository) {
      return
    }

    const shouldContinue = await this.checkOrAddPipeline(cwd)
    if (!shouldContinue) {
      return
    }

    return await repository.modifyExperimentParamsAndRun(commandId, overrideId)
  }

  public async modifyExperimentParamsAndQueue(
    overrideRoot?: string,
    overrideId?: string
  ) {
    const cwd = await this.getDvcRoot(overrideRoot)
    if (!cwd) {
      return
    }
    const shouldContinue = await this.checkOrAddPipeline(cwd)
    if (!shouldContinue) {
      return
    }
    const repository = this.getRepository(cwd)
    if (!repository) {
      return
    }

    return await repository.modifyExperimentParamsAndQueue(overrideId)
  }

  public async getCwdThenRun(commandId: CommandId) {
    const cwd = await this.shouldRun()

    if (!cwd) {
      return 'Could not run task'
    }

    return this.internalCommands.executeCommand(commandId, cwd)
  }

  public getCwdThenReport(commandId: CommandId) {
    return Toast.showOutput(this.getCwdThenRun(commandId))
  }

  public getCwdAndExpNameThenRun(commandId: CommandId) {
    return this.pickExpThenRun(commandId, cwd => this.pickExperiment(cwd))
  }

  public async getCwdAndQuickPickThenRun(
    commandId: CommandId,
    quickPick: () => Thenable<string[] | undefined>
  ) {
    const cwd = await this.shouldRun()
    if (!cwd) {
      return
    }
    const result = await quickPick()

    if (result) {
      return this.runCommand(commandId, cwd, ...result)
    }
  }

  public async getCwdExpNameAndInputThenRun(
    runCommand: (cwd: string, ...args: Args) => Promise<void>,
    title: Title
  ) {
    const cwd = await this.shouldRun()
    if (!cwd) {
      return
    }

    const experimentId = await this.pickExperiment(cwd)

    if (!experimentId) {
      return
    }
    return this.getInputAndRun(runCommand, title, cwd, experimentId)
  }

  public async getInputAndRun(
    runCommand: (...args: Args) => Promise<void> | void,
    title: Title,
    ...args: Args
  ) {
    const input = await getInput(title)
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
    const cwd = await this.shouldRun()
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

  public createRepository(dvcRoot: string, resourceLocator: ResourceLocator) {
    const experiments = this.dispose.track(
      new Experiments(
        dvcRoot,
        this.internalCommands,
        resourceLocator,
        this.workspaceState,
        () => this.checkOrAddPipeline(dvcRoot),
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
      experiments.onDidChangeIsParamsFileFocused(
        dvcRoot => (this.focusedParamsDvcRoot = dvcRoot)
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
      this.focusedParamsDvcRoot ||
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
        .filter(branch => branch.indexOf('*') !== 0)
        .map(branch => ({
          label: branch,
          picked: branchesSelected.includes(branch),
          value: branch
        })),
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

  private async shouldRun() {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }
    const shouldContinue = await this.checkOrAddPipeline(cwd)
    if (!shouldContinue) {
      return
    }
    return cwd
  }

  private async checkOrAddPipeline(cwd: string) {
    const stages = await this.internalCommands.executeCommand(
      AvailableCommands.STAGE_LIST,
      cwd
    )

    if (hasDvcYamlFile(cwd) && stages === undefined) {
      await Toast.showError(
        'Cannot perform task. Your dvc.yaml file is invalid.'
      )
      return false
    }

    if (!stages) {
      return this.addPipeline(cwd)
    }
    return true
  }

  private async addPipeline(cwd: string) {
    const stageName = await this.askForStageName()
    if (!stageName) {
      return false
    }

    const { trainingScript, command, enteredManually } =
      await this.askForTrainingScript()
    if (!trainingScript) {
      return false
    }
    void findOrCreateDvcYamlFile(
      cwd,
      trainingScript,
      stageName,
      command,
      !enteredManually
    )
    return true
  }

  private async askForStageName() {
    return await getValidInput(
      Title.ENTER_STAGE_NAME,
      (stageName?: string) => {
        if (!stageName) {
          return 'Stage name must not be empty'
        }
        if (!/^[a-z]/i.test(stageName)) {
          return 'Stage name should start with a letter'
        }
        return /^\w+$/.test(stageName)
          ? null
          : 'Stage name should only include letters and numbers'
      },
      { value: 'train' }
    )
  }

  private async askForTrainingScript() {
    const selectValue = 'select'
    const pathOrSelect = await quickPickOneOrInput(
      [{ label: 'Select from file explorer', value: selectValue }],
      {
        defaultValue: '',
        placeholder: 'Path to script',
        title: Title.ENTER_PATH_OR_CHOOSE_FILE
      }
    )

    const trainingScript =
      pathOrSelect === selectValue
        ? await pickFile(Title.SELECT_TRAINING_SCRIPT)
        : pathOrSelect

    if (!trainingScript) {
      return {
        command: undefined,
        enteredManually: false,
        trainingScript: undefined
      }
    }

    const command =
      getScriptCommand(trainingScript) ||
      (await getInput(Title.ENTER_COMMAND_TO_RUN)) ||
      ''
    const enteredManually = pathOrSelect !== selectValue
    return { command, enteredManually, trainingScript }
  }

  private async pickIdsThenRun(
    pickMethod: 'pickQueueTasksToKill' | 'pickExperimentsToRemove',
    commandId:
      | typeof AvailableCommands.QUEUE_KILL
      | typeof AvailableCommands.EXP_REMOVE
  ) {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const ids = await this.getRepository(cwd)[pickMethod]()

    if (!ids || isEmpty(ids)) {
      return
    }
    return this.runCommand(commandId, cwd, ...ids)
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

  private pickExperiment(cwd: string) {
    return this.getRepository(cwd).pickExperiment()
  }
}
