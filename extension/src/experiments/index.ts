import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
import { ExperimentsWebview } from './webview'
import { ExperimentsTable } from './table'
import { Config } from '../config'
import { ResourceLocator } from '../resourceLocator'
import { report } from '../vscode/reporting'
import { getInput } from '../vscode/inputBox'
import { CliRunner } from '../cli/runner'
import { reset } from '../util/disposable'
import { AvailableCommands, InternalCommands } from '../internalCommands'

type ExperimentsTables = Record<string, ExperimentsTable>

export class Experiments {
  @observable
  private focusedWebviewDvcRoot: string | undefined

  public dispose = Disposable.fn()

  private experiments: ExperimentsTables = {}
  private config: Config

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise
  private readonly internalCommands: InternalCommands

  constructor(
    config: Config,
    internalCommands: InternalCommands,
    experiments?: Record<string, ExperimentsTable>
  ) {
    makeObservable(this)

    this.config = config
    this.internalCommands = internalCommands
    if (experiments) {
      this.experiments = experiments
    }
  }

  public isReady() {
    return this.initialized
  }

  public getFocused(): ExperimentsTable | undefined {
    if (!this.focusedWebviewDvcRoot) {
      return undefined
    }
    return this.experiments[this.focusedWebviewDvcRoot]
  }

  public getCwdThenRun = async (commandName: AvailableCommands) => {
    const cwd = await this.getFocusedOrDefaultOrPickProject()
    if (!cwd) {
      return
    }

    report(this.internalCommands.executeCommand(commandName, cwd))
  }

  public getExpNameThenRun = async (commandName: AvailableCommands) => {
    const cwd = await this.getFocusedOrDefaultOrPickProject()
    if (!cwd) {
      return
    }

    const name = await this.internalCommands.executeCommand(
      AvailableCommands.PICK_EXPERIMENT_NAME,
      cwd
    )

    if (!name) {
      return
    }
    return report(this.internalCommands.executeCommand(commandName, cwd, name))
  }

  public getCwdAndQuickPickThenRun = async <T>(
    func: (cwd: string, result: T) => Promise<string>,
    quickPick: () => Thenable<T | undefined>
  ) => {
    const cwd = await this.getFocusedOrDefaultOrPickProject()
    if (!cwd) {
      return
    }
    const result = await quickPick()

    if (result) {
      report(func(cwd, result))
    }
  }

  public getExpNameAndInputThenRun = async (
    func: (cwd: string, experiment: string, input: string) => Promise<string>,
    prompt: string
  ) => {
    const cwd = await this.getFocusedOrDefaultOrPickProject()
    if (!cwd) {
      return
    }

    const name = await this.internalCommands.executeCommand(
      AvailableCommands.PICK_EXPERIMENT_NAME,
      cwd
    )

    if (!name) {
      return
    }
    const input = await getInput(prompt)
    if (input) {
      report(func(cwd, name, input))
    }
  }

  public async showExperimentsTable() {
    const dvcRoot = await this.getDefaultOrPickProject()
    if (!dvcRoot) {
      return
    }

    return this.showExperimentsWebview(dvcRoot)
  }

  public showExperimentsTableThenRun = async (
    cliRunner: CliRunner,
    func: (cliRunner: CliRunner, dvcRoot: string) => Promise<void>
  ) => {
    const dvcRoot = await this.getFocusedOrDefaultOrPickProject()
    if (!dvcRoot) {
      return
    }

    const experimentsTable = await this.showExperimentsWebview(dvcRoot)
    if (!experimentsTable) {
      return
    }

    func(cliRunner, dvcRoot)
    const listener = cliRunner.dispose.track(
      cliRunner.onDidCompleteProcess(() => {
        experimentsTable.refresh()
        cliRunner.dispose.untrack(listener)
        listener.dispose()
      })
    )
    return experimentsTable
  }

  public create(
    dvcRoots: string[],
    resourceLocator: ResourceLocator
  ): ExperimentsTable[] {
    const experiments = dvcRoots.map(dvcRoot =>
      this.createExperimentsTable(dvcRoot, resourceLocator)
    )

    Promise.all(
      experiments.map(experimentsTable => experimentsTable.isReady())
    ).then(() => {
      this.deferred.resolve()
    })

    return experiments
  }

  public reset(): void {
    this.experiments = reset<ExperimentsTables>(this.experiments, this.dispose)
  }

  public onDidChangeData(dvcRoot: string, gitRoot: string) {
    const experimentsTable = this.experiments[dvcRoot]
    experimentsTable.onDidChangeData(gitRoot)
  }

  public setWebview(dvcRoot: string, experimentsWebview: ExperimentsWebview) {
    const experimentsTable = this.experiments[dvcRoot]
    if (!experimentsTable) {
      experimentsWebview.dispose()
    }

    experimentsTable.setWebview(experimentsWebview)
  }

  private getFocusedOrDefaultOrPickProject() {
    return this.focusedWebviewDvcRoot || this.getDefaultOrPickProject()
  }

  private getDefaultOrPickProject() {
    return this.internalCommands.executeCommand(
      AvailableCommands.GET_DEFAULT_OR_PICK_PROJECT,
      ...Object.keys(this.experiments)
    )
  }

  private async showExperimentsWebview(
    dvcRoot: string
  ): Promise<ExperimentsTable> {
    const experimentsTable = this.experiments[dvcRoot]
    await experimentsTable.showWebview()
    return experimentsTable
  }

  private createExperimentsTable(
    dvcRoot: string,
    resourceLocator: ResourceLocator
  ) {
    const experimentsTable = this.dispose.track(
      new ExperimentsTable(
        dvcRoot,
        this.config,
        this.internalCommands,
        resourceLocator
      )
    )

    this.experiments[dvcRoot] = experimentsTable

    this.dispose.track(
      experimentsTable.onDidChangeIsWebviewFocused(
        dvcRoot => (this.focusedWebviewDvcRoot = dvcRoot)
      )
    )
    return experimentsTable
  }
}
