import { EventEmitter, Memento } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { ExperimentsWebview } from './webview'
import { FilterDefinition } from './model/filterBy'
import { ExperimentsRepository } from './repository'
import { pickExperimentName } from './quickPick'
import { SortDefinition } from './model/sortBy'
import { ResourceLocator } from '../resourceLocator'
import { reportOutput } from '../vscode/reporting'
import { getInput } from '../vscode/inputBox'
import { reset } from '../util/disposable'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../commands/internal'
import { BaseContainer, IContainer } from '../container'

export class Experiments
  extends BaseContainer<ExperimentsRepository>
  implements IContainer<ExperimentsRepository, ResourceLocator>
{
  @observable
  private focusedWebviewDvcRoot: string | undefined

  public readonly experimentsChanged = new EventEmitter<void>()
  public readonly paramsOrMetricsChanged = new EventEmitter<void>()

  private readonly workspaceState: Memento

  constructor(
    internalCommands: InternalCommands,
    workspaceState: Memento,
    experiments?: Record<string, ExperimentsRepository>
  ) {
    super(internalCommands)
    makeObservable(this)

    this.workspaceState = workspaceState

    if (experiments) {
      this.contents = experiments
    }
  }

  public getFocusedTable(): ExperimentsRepository | undefined {
    if (!this.focusedWebviewDvcRoot) {
      return undefined
    }
    return this.contents[this.focusedWebviewDvcRoot]
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

    const experimentsRepository = await this.showExperimentsWebview(dvcRoot)
    if (!experimentsRepository) {
      return
    }

    this.internalCommands.executeCommand(commandId, dvcRoot)
    return experimentsRepository
  }

  public create(
    dvcRoots: string[],
    resourceLocator: ResourceLocator
  ): ExperimentsRepository[] {
    const experiments = dvcRoots.map(dvcRoot =>
      this.createExperimentsRepository(dvcRoot, resourceLocator)
    )

    Promise.all(
      experiments.map(experimentsRepository => experimentsRepository.isReady())
    ).then(() => {
      this.deferred.resolve()
    })

    return experiments
  }

  public reset(): void {
    this.contents = reset<ExperimentsRepository>(this.contents, this.dispose)
  }

  public onDidChangeData(dvcRoot: string, gitRoot: string) {
    const experimentsRepository = this.getRepository(dvcRoot)
    experimentsRepository.onDidChangeData(gitRoot)
  }

  public refreshData(dvcRoot: string) {
    const experimentsRepository = this.getRepository(dvcRoot)
    experimentsRepository?.refresh()
  }

  public setWebview(dvcRoot: string, experimentsWebview: ExperimentsWebview) {
    const experimentsRepository = this.getRepository(dvcRoot)
    if (!experimentsRepository) {
      experimentsWebview.dispose()
    }

    experimentsRepository.setWebview(experimentsWebview)
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

  private async showExperimentsWebview(
    dvcRoot: string
  ): Promise<ExperimentsRepository> {
    const experimentsRepository = this.getRepository(dvcRoot)
    await experimentsRepository.showWebview()
    return experimentsRepository
  }

  private createExperimentsRepository(
    dvcRoot: string,
    resourceLocator: ResourceLocator
  ) {
    const experimentsRepository = this.dispose.track(
      new ExperimentsRepository(
        dvcRoot,
        this.internalCommands,
        resourceLocator,
        this.workspaceState
      )
    )

    this.contents[dvcRoot] = experimentsRepository

    experimentsRepository.dispose.track(
      experimentsRepository.onDidChangeIsWebviewFocused(
        dvcRoot => (this.focusedWebviewDvcRoot = dvcRoot)
      )
    )
    experimentsRepository.dispose.track(
      experimentsRepository.onDidChangeExperiments(() =>
        this.experimentsChanged.fire()
      )
    )

    experimentsRepository.dispose.track(
      experimentsRepository.onDidChangeParamsOrMetrics(() =>
        this.paramsOrMetricsChanged.fire()
      )
    )
    return experimentsRepository
  }
}
