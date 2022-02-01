import { EventEmitter, Memento } from 'vscode'
import { Experiments } from '.'
import { TableData } from './webview/contract'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../commands/internal'
import { ResourceLocator } from '../resourceLocator'
import { reportOutput } from '../vscode/reporting'
import { getInput } from '../vscode/inputBox'
import { BaseWorkspaceWebviews } from '../webview/workspace'
import { WorkspacePlots } from '../plots/workspace'

export class WorkspaceExperiments extends BaseWorkspaceWebviews<
  Experiments,
  TableData
> {
  public readonly experimentsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  public readonly metricsOrParamsChanged = this.dispose.track(
    new EventEmitter<void>()
  )

  public readonly updatesPaused: EventEmitter<boolean>

  private focusedWebviewDvcRoot: string | undefined

  constructor(
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    workspaceState: Memento,
    experiments?: Record<string, Experiments>
  ) {
    super(internalCommands, workspaceState, experiments)

    this.updatesPaused = updatesPaused
  }

  public linkRepositories(workspacePlots: WorkspacePlots) {
    Object.entries(this.repositories).forEach(([dvcRoot, repository]) =>
      workspacePlots.getRepository(dvcRoot).setExperiments(repository)
    )
  }

  public getFocusedWebview(): Experiments | undefined {
    if (!this.focusedWebviewDvcRoot) {
      return undefined
    }
    return this.getRepository(this.focusedWebviewDvcRoot)
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

  public async queueExperimentFromExisting() {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const repository = this.getRepository(cwd)
    if (!repository) {
      return
    }

    const paramsToQueue = await repository.pickParamsToQueue()
    if (!paramsToQueue) {
      return
    }

    return reportOutput(
      this.internalCommands.executeCommand(
        AvailableCommands.EXPERIMENT_QUEUE,
        cwd,
        ...paramsToQueue
      )
    )
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
    return reportOutput(stdout)
  }

  public getExpNameThenRun = async (commandId: CommandId) => {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experiment = await this.pickCurrentExperiment(cwd)

    if (!experiment) {
      return
    }
    return reportOutput(
      this.internalCommands.executeCommand(commandId, cwd, experiment.name)
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
      return reportOutput(
        this.internalCommands.executeCommand(commandId, cwd, ...result)
      )
    }
  }

  public getExpNameAndInputThenRun = async (
    commandId: CommandId,
    title: string
  ) => {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experiment = await this.pickCurrentExperiment(cwd)

    if (!experiment) {
      return
    }
    const input = await getInput(title)
    if (input) {
      return reportOutput(
        this.internalCommands.executeCommand(
          commandId,
          cwd,
          experiment.name,
          input
        )
      )
    }
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
      experiments.onDidChangeMetricsOrParams(() => {
        this.metricsOrParamsChanged.fire()
      })
    )

    return experiments
  }

  private async getDvcRoot(overrideRoot?: string) {
    return overrideRoot || (await this.getFocusedOrOnlyOrPickProject())
  }

  private getFocusedOrOnlyOrPickProject() {
    return this.focusedWebviewDvcRoot || this.getOnlyOrPickProject()
  }

  private pickCurrentExperiment(cwd: string) {
    return this.getRepository(cwd).pickCurrentExperiment()
  }
}
