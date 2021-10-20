import { EventEmitter, Memento } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { Experiments } from '.'
import { TableWebview } from './webview/table'
import { FilterDefinition } from './model/filterBy'
import { pickExperimentName } from './quickPick'
import { SortDefinition } from './model/sortBy'
import { ResourceLocator } from '../resourceLocator'
import { reportOutput } from '../vscode/reporting'
import { getInput } from '../vscode/inputBox'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../commands/internal'
import { BaseWorkspace, IWorkspace } from '../workspace'

export class WorkspaceExperiments
  extends BaseWorkspace<Experiments>
  implements IWorkspace<Experiments, ResourceLocator>
{
  @observable
  private focusedWebviewDvcRoot: string | undefined

  public readonly experimentsChanged = new EventEmitter<void>()
  public readonly paramsOrMetricsChanged = new EventEmitter<void>()

  private readonly workspaceState: Memento

  constructor(
    internalCommands: InternalCommands,
    workspaceState: Memento,
    experiments?: Record<string, Experiments>
  ) {
    super(internalCommands)
    makeObservable(this)

    this.workspaceState = workspaceState

    if (experiments) {
      this.repositories = experiments
    }
  }

  public getFocusedTable(): Experiments | undefined {
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

  public removeFilter(dvcRoot: string, id: string) {
    return this.getRepository(dvcRoot).removeFilter(id)
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

  public removeSort(dvcRoot: string, pathToRemove: string) {
    return this.getRepository(dvcRoot).removeSort(pathToRemove)
  }

  public getChildParamsOrMetrics(dvcRoot: string, path: string) {
    return this.getRepository(dvcRoot).getChildParamsOrMetrics(path)
  }

  public toggleParamOrMetricStatus(dvcRoot: string, path: string) {
    return this.getRepository(dvcRoot).toggleParamOrMetricStatus(path)
  }

  public getParamsAndMetricsStatuses(dvcRoot: string) {
    return this.getRepository(dvcRoot).getParamsAndMetricsStatuses()
  }

  public getSorts(dvcRoot: string): SortDefinition[] {
    return this.getRepository(dvcRoot).getSorts()
  }

  public getFilters(dvcRoot: string): FilterDefinition[] {
    return this.getRepository(dvcRoot).getFilters()
  }

  public getExperiments(dvcRoot: string) {
    return this.getRepository(dvcRoot).getExperiments()
  }

  public getCheckpoints(dvcRoot: string, experimentId: string) {
    return this.getRepository(dvcRoot).getCheckpoints(experimentId)
  }

  public getCwdThenRun = async (commandId: CommandId) => {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    return reportOutput(this.internalCommands.executeCommand(commandId, cwd))
  }

  public getExpNameThenRun = async (commandId: CommandId) => {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experimentName = await this.pickExperimentName(cwd)

    if (!experimentName) {
      return
    }
    return reportOutput(
      this.internalCommands.executeCommand(commandId, cwd, experimentName)
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
    prompt: string
  ) => {
    const cwd = await this.getFocusedOrOnlyOrPickProject()
    if (!cwd) {
      return
    }

    const experimentName = await this.pickExperimentName(cwd)

    if (!experimentName) {
      return
    }
    const input = await getInput(prompt)
    if (input) {
      return reportOutput(
        this.internalCommands.executeCommand(
          commandId,
          cwd,
          experimentName,
          input
        )
      )
    }
  }

  public async showExperimentsTable() {
    const dvcRoot = await this.getOnlyOrPickProject()
    if (!dvcRoot) {
      return
    }

    return this.showExperimentsWebview(dvcRoot)
  }

  public showExperimentsTableThenRun = async (commandId: CommandId) => {
    const dvcRoot = await this.getFocusedOrOnlyOrPickProject()
    if (!dvcRoot) {
      return
    }

    const experiments = await this.showExperimentsWebview(dvcRoot)
    if (!experiments) {
      return
    }

    this.internalCommands.executeCommand(commandId, dvcRoot)
    return experiments
  }

  public create(
    dvcRoots: string[],
    resourceLocator: ResourceLocator
  ): Experiments[] {
    const experiments = dvcRoots.map(dvcRoot =>
      this.createExperiments(dvcRoot, resourceLocator)
    )

    Promise.all(experiments.map(experiments => experiments.isReady())).then(
      () => this.deferred.resolve()
    )

    return experiments
  }

  public refreshData(dvcRoot: string) {
    const experiments = this.getRepository(dvcRoot)
    experiments?.refresh()
  }

  public setWebview(dvcRoot: string, experimentsWebview: TableWebview) {
    const experiments = this.getRepository(dvcRoot)
    if (!experiments) {
      experimentsWebview.dispose()
    }

    experiments.setWebview(experimentsWebview)
  }

  private async getDvcRoot(overrideRoot?: string) {
    return overrideRoot || (await this.getFocusedOrOnlyOrPickProject())
  }

  private getFocusedOrOnlyOrPickProject() {
    return this.focusedWebviewDvcRoot || this.getOnlyOrPickProject()
  }

  private pickExperimentName(cwd: string) {
    return pickExperimentName(
      this.internalCommands.executeCommand(
        AvailableCommands.EXPERIMENT_LIST_CURRENT,
        cwd
      )
    )
  }

  private async showExperimentsWebview(dvcRoot: string): Promise<Experiments> {
    const experiments = this.getRepository(dvcRoot)
    await experiments.showWebview()
    return experiments
  }

  private createExperiments(dvcRoot: string, resourceLocator: ResourceLocator) {
    const experiments = this.dispose.track(
      new Experiments(
        dvcRoot,
        this.internalCommands,
        resourceLocator,
        this.workspaceState
      )
    )

    this.setRepository(dvcRoot, experiments)

    experiments.onDidChangeData()

    experiments.dispose.track(
      experiments.onDidChangeIsWebviewFocused(
        dvcRoot => (this.focusedWebviewDvcRoot = dvcRoot)
      )
    )
    experiments.dispose.track(
      experiments.onDidChangeExperiments(() => this.experimentsChanged.fire())
    )

    experiments.dispose.track(
      experiments.onDidChangeParamsOrMetrics(() =>
        this.paramsOrMetricsChanged.fire()
      )
    )
    return experiments
  }
}
