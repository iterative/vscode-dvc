import { join } from 'path'
import { EventEmitter, Memento } from 'vscode'
import isEmpty from 'lodash.isempty'
import { Experiments, ModifiedExperimentAndRunCommandId } from '.'
import { TableData } from './webview/contract'
import { Args, DVCLIVE_ONLY_RUNNING_SIGNAL_FILE } from '../cli/dvc/constants'
import {
  AvailableCommands,
  CommandId,
  InternalCommands
} from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { Toast } from '../vscode/toast'
import { getInput, getPositiveIntegerInput } from '../vscode/inputBox'
import { BaseWorkspaceWebviews } from '../webview/workspace'
import { Title } from '../vscode/title'
import { ContextKey, setContextValue } from '../vscode/context'
import { getPidFromSignalFile } from '../fileSystem'
import { definedAndNonEmpty } from '../util/array'

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

  public readonly updatesPaused: EventEmitter<boolean>

  private readonly checkpointsChanged: EventEmitter<void>

  private focusedParamsDvcRoot: string | undefined

  constructor(
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    workspaceState: Memento,
    experiments?: Record<string, Experiments>,
    checkpointsChanged?: EventEmitter<void>
  ) {
    super(internalCommands, workspaceState, experiments)

    this.updatesPaused = updatesPaused

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

  public async addFilter(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).addFilter()
  }

  public async addStarredFilter(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).addStarredFilter()
  }

  public async removeFilters() {
    const dvcRoot = await this.getFocusedOrOnlyOrPickProject()
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).removeFilters()
  }

  public async addSort(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).addSort()
  }

  public async addStarredSort(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).addStarredSort()
  }

  public async removeSorts() {
    const dvcRoot = await this.getFocusedOrOnlyOrPickProject()
    if (!dvcRoot) {
      return
    }

    return this.getRepository(dvcRoot).removeSorts()
  }

  public async selectExperiments(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).selectExperiments()
  }

  public async selectColumns(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).selectColumns()
  }

  public async selectQueueTasksToKill() {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const tasks = await this.getRepository(cwd).pickQueueTasksToKill()

    if (!tasks || isEmpty(tasks)) {
      return
    }
    return this.runCommand(
      AvailableCommands.QUEUE_KILL,
      cwd,
      ...tasks.map(({ id }) => id)
    )
  }

  public async selectExperimentsToRemove() {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experiments = await this.getRepository(cwd).pickExperimentsToRemove()
    if (!experiments || isEmpty(experiments)) {
      return
    }

    return this.runCommand(
      AvailableCommands.EXPERIMENT_REMOVE,
      cwd,
      ...experiments?.map(({ id }) => id)
    )
  }

  public async autoApplyFilters(enable: boolean, overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).autoApplyFilters(enable)
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

    const repository = this.getRepository(cwd)
    if (!repository) {
      return
    }

    return await repository.modifyExperimentParamsAndQueue(overrideId)
  }

  public async getCwdThenRun(commandId: CommandId) {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    return this.internalCommands.executeCommand(commandId, cwd)
  }

  public async pauseUpdatesThenRun(func: () => Promise<void> | undefined) {
    this.updatesPaused.fire(true)
    await func()
    this.updatesPaused.fire(false)
  }

  public async getCwdThenReport(commandId: CommandId) {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const stdout = this.internalCommands.executeCommand(commandId, cwd)
    return Toast.showOutput(stdout)
  }

  public getCwdAndExpNameThenRun(commandId: CommandId) {
    return this.pickExpThenRun(commandId, cwd =>
      this.pickCurrentExperiment(cwd)
    )
  }

  public getQueuedExpThenRun(commandId: CommandId) {
    return this.pickExpThenRun(commandId, cwd =>
      this.getRepository(cwd).pickQueuedExperiment()
    )
  }

  public async getCwdAndQuickPickThenRun(
    commandId: CommandId,
    quickPick: () => Thenable<string[] | undefined>
  ) {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
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
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experiment = await this.pickCurrentExperiment(cwd)

    if (!experiment) {
      return
    }
    return this.getInputAndRun(runCommand, title, cwd, experiment.name)
  }

  public getExpNameAndInputThenRun(
    runCommand: (...args: Args) => Promise<void> | void,
    title: Title,
    cwd: string,
    id: string
  ) {
    const name = this.getRepository(cwd)?.getExperimentDisplayName(id)

    if (!name) {
      return
    }

    return this.getInputAndRun(runCommand, title, cwd, name)
  }

  public getExpNameThenRun(commandId: CommandId, cwd: string, id: string) {
    const name = this.getRepository(cwd)?.getExperimentDisplayName(id)

    if (!name) {
      return
    }

    return this.runCommand(commandId, cwd, name)
  }

  public async getCwdIntegerInputAndRun(
    commandId: CommandId,
    title: Title,
    options: { prompt: string; value: string }
  ) {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
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
    updatesPaused: EventEmitter<boolean>,
    resourceLocator: ResourceLocator
  ) {
    const experiments = this.dispose.track(
      new Experiments(
        dvcRoot,
        this.internalCommands,
        updatesPaused,
        resourceLocator,
        this.workspaceState
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

  public async hasDvcLiveOnlyExperimentRunning() {
    return definedAndNonEmpty(await this.getDvcLiveOnlyPids())
  }

  public async getDvcLiveOnlyPids() {
    const pids: number[] = []

    for (const dvcRoot of this.getDvcRoots()) {
      const signalFile = join(dvcRoot, DVCLIVE_ONLY_RUNNING_SIGNAL_FILE)
      const pid = await getPidFromSignalFile(signalFile)
      if (!pid) {
        continue
      }
      pids.push(pid)
    }

    return pids
  }

  private async pickExpThenRun(
    commandId: CommandId,
    pickFunc: (
      cwd: string
    ) => Thenable<{ id: string; name: string } | undefined> | undefined
  ) {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experiment = await pickFunc(cwd)

    if (!experiment) {
      return
    }
    return this.runCommand(commandId, cwd, experiment.name)
  }

  private async getInputAndRun(
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

  private pickCurrentExperiment(cwd: string) {
    return this.getRepository(cwd).pickCurrentExperiment()
  }
}
