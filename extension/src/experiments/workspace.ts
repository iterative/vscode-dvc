import { EventEmitter, Memento } from 'vscode'
import { Experiments } from '.'
import { TableData } from './webview/contract'
import { CommandId, InternalCommands } from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { Toast } from '../vscode/toast'
import { getInput } from '../vscode/inputBox'
import { BaseWorkspaceWebviews } from '../webview/workspace'
import { WorkspacePlots } from '../plots/workspace'
import { Title } from '../vscode/title'
import { setContextValue } from '../vscode/context'

export class WorkspaceExperiments extends BaseWorkspaceWebviews<
  Experiments,
  TableData
> {
  public readonly experimentsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  public readonly columnsChanged = this.dispose.track(new EventEmitter<void>())

  public readonly updatesPaused: EventEmitter<boolean>

  private readonly checkpointsChanged: EventEmitter<void>

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

        setContextValue('dvc.experiment.checkpoints', workspaceHasCheckpoints)
      })
    )
  }

  public linkRepositories(workspacePlots: WorkspacePlots) {
    for (const [dvcRoot, repository] of Object.entries(this.repositories)) {
      workspacePlots.getRepository(dvcRoot).setExperiments(repository)
    }
  }

  public async addFilter(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).addFilter()
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

  public async autoApplyFilters(enable: boolean, overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).autoApplyFilters(enable)
  }

  public async modifyExperimentParamsAndRun(
    commandId: CommandId,
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

  public getCwdThenReport(commandId: CommandId) {
    const stdout = this.getCwdThenRun(commandId)
    if (!stdout) {
      return
    }
    return Toast.showOutput(stdout)
  }

  public getExpNameThenRun(commandId: CommandId) {
    return this.pickExpThenRun(commandId, cwd =>
      this.pickCurrentExperiment(cwd)
    )
  }

  public getQueuedExpThenRun(commandId: CommandId) {
    return this.pickExpThenRun(commandId, cwd =>
      this.getRepository(cwd).pickQueuedExperiment()
    )
  }

  public getCwdAndQuickPickThenRun = async (
    commandId: CommandId,
    quickPick: () => Thenable<string[] | undefined>
  ) => {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }
    const result = await quickPick()

    if (result) {
      return this.runCommand(commandId, cwd, ...result)
    }
  }

  public getExpNameAndInputThenRun = async (
    commandId: CommandId,
    title: Title
  ) => {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experiment = await this.pickCurrentExperiment(cwd)

    if (!experiment) {
      return
    }
    return this.getInputAndRun(commandId, cwd, title, experiment.name)
  }

  public async getInputAndRun(
    commandId: CommandId,
    cwd: string,
    title: Title,
    ...args: string[]
  ) {
    const input = await getInput(title)
    if (input) {
      return this.runCommand(commandId, cwd, ...args, input)
    }
  }

  public runCommand(commandId: CommandId, cwd: string, ...args: string[]) {
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
      experiments.onDidChangeCheckpoints(() => {
        this.checkpointsChanged.fire()
      })
    )

    return experiments
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

  private pickCurrentExperiment(cwd: string) {
    return this.getRepository(cwd).pickCurrentExperiment()
  }
}
