import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'
import { ExperimentsWebview } from './webview'
import { ExperimentsTable } from './table'
import { pickExperimentName } from './quickPick'
import { ResourceLocator } from '../resourceLocator'
import { report } from '../vscode/reporting'
import { getInput } from '../vscode/inputBox'
import { reset } from '../util/disposable'
import {
  CommandId,
  AvailableCommands,
  InternalCommands
} from '../internalCommands'

type ExperimentsTables = Record<string, ExperimentsTable>

export class Experiments {
  @observable
  private focusedWebviewDvcRoot: string | undefined

  public dispose = Disposable.fn()

  private experiments: ExperimentsTables = {}

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise
  private readonly internalCommands: InternalCommands

  constructor(
    internalCommands: InternalCommands,
    experiments?: Record<string, ExperimentsTable>
  ) {
    makeObservable(this)

    this.internalCommands = internalCommands
    if (experiments) {
      this.experiments = experiments
    }
  }

  public isReady() {
    return this.initialized
  }

  public async pickSort() {
    const table = await this.getFocusedTable()
    table.pickSort()
  }

  public async clearSort() {
    const table = await this.getFocusedTable()
    table.setSort(undefined)
  }

  public getFocused(): ExperimentsTable | undefined {
    if (!this.focusedWebviewDvcRoot) {
      return undefined
    }
    return this.experiments[this.focusedWebviewDvcRoot]
  }

  public getDvcRoots() {
    return Object.keys(this.experiments)
  }

  public getColumn(dvcRoot: string, path: string) {
    return this.getTable(dvcRoot).getColumn(path)
  }

  public getChildColumns(dvcRoot: string, path: string) {
    return this.getTable(dvcRoot).getChildColumns(path)
  }

  public toggleColumnStatus(dvcRoot: string, path: string) {
    return this.getTable(dvcRoot).toggleColumnStatus(path)
  }

  public getSortedBy(): string[] {
    return []
  }

  public getFilteredBy(): string[] {
    return []
  }

  public getRunningOrQueued(): string[] {
    return []
  }

  public getCwdThenRun = async (commandId: CommandId) => {
    const cwd = await this.getFocusedOrDefaultOrPickProject()
    if (!cwd) {
      return
    }

    report(this.internalCommands.executeCommand(commandId, cwd))
  }

  public getExpNameThenRun = async (commandId: CommandId) => {
    const cwd = await this.getFocusedOrDefaultOrPickProject()
    if (!cwd) {
      return
    }

    const experimentName = await this.pickExperimentName(cwd)

    if (!experimentName) {
      return
    }
    return report(
      this.internalCommands.executeCommand(commandId, cwd, experimentName)
    )
  }

  public getCwdAndQuickPickThenRun = async (
    commandId: CommandId,
    quickPick: () => Thenable<string[] | undefined>
  ) => {
    const cwd = await this.getFocusedOrDefaultOrPickProject()
    if (!cwd) {
      return
    }
    const result = await quickPick()

    if (result) {
      report(this.internalCommands.executeCommand(commandId, cwd, ...result))
    }
  }

  public getExpNameAndInputThenRun = async (
    commandId: CommandId,
    prompt: string
  ) => {
    const cwd = await this.getFocusedOrDefaultOrPickProject()
    if (!cwd) {
      return
    }

    const experimentName = await this.pickExperimentName(cwd)

    if (!experimentName) {
      return
    }
    const input = await getInput(prompt)
    if (input) {
      report(
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
    const dvcRoot = await this.getDefaultOrPickProject()
    if (!dvcRoot) {
      return
    }

    return this.showExperimentsWebview(dvcRoot)
  }

  public showExperimentsTableThenRun = async (commandId: CommandId) => {
    const dvcRoot = await this.getFocusedOrDefaultOrPickProject()
    if (!dvcRoot) {
      return
    }

    const experimentsTable = await this.showExperimentsWebview(dvcRoot)
    if (!experimentsTable) {
      return
    }

    this.internalCommands.executeCommand(commandId, dvcRoot)
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
    const experimentsTable = this.getTable(dvcRoot)
    experimentsTable.onDidChangeData(gitRoot)
  }

  public refreshData(dvcRoot: string) {
    const experimentsTable = this.getTable(dvcRoot)
    experimentsTable?.refresh()
  }

  public setWebview(dvcRoot: string, experimentsWebview: ExperimentsWebview) {
    const experimentsTable = this.getTable(dvcRoot)
    if (!experimentsTable) {
      experimentsWebview.dispose()
    }

    experimentsTable.setWebview(experimentsWebview)
  }

  private getTable(dvcRoot: string) {
    return this.experiments[dvcRoot]
  }

  private async getFocusedTable() {
    return this.getTable(await this.getFocusedOrDefaultOrPickProject())
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
  ): Promise<ExperimentsTable> {
    const experimentsTable = this.getTable(dvcRoot)
    await experimentsTable.showWebview()
    return experimentsTable
  }

  private createExperimentsTable(
    dvcRoot: string,
    resourceLocator: ResourceLocator
  ) {
    const experimentsTable = this.dispose.track(
      new ExperimentsTable(dvcRoot, this.internalCommands, resourceLocator)
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
