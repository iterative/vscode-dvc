import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { EventEmitter } from 'vscode'
import { makeObservable, observable } from 'mobx'
import { ExperimentsWebview } from './webview'
import { ExperimentsRepository } from './repository'
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

type ExperimentsRepositories = Record<string, ExperimentsRepository>

export class Experiments {
  @observable
  private focusedWebviewDvcRoot: string | undefined

  public dispose = Disposable.fn()
  public readonly experimentsRowsChanged = new EventEmitter<void>()
  public readonly experimentsColumnsChanged = new EventEmitter<void>()

  private experiments: ExperimentsRepositories = {}

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise
  private readonly internalCommands: InternalCommands

  constructor(
    internalCommands: InternalCommands,
    experiments?: Record<string, ExperimentsRepository>
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

  public getFocusedTable(): ExperimentsRepository | undefined {
    if (!this.focusedWebviewDvcRoot) {
      return undefined
    }
    return this.experiments[this.focusedWebviewDvcRoot]
  }

  public async getFocusedOrDefaultOrPickRepo() {
    return this.getRepository(await this.getFocusedOrDefaultOrPickProject())
  }

  public async pickSort() {
    const repository = await this.getFocusedOrDefaultOrPickRepo()
    repository.pickSort()
  }

  public async clearSort() {
    const repository = await this.getFocusedOrDefaultOrPickRepo()
    repository.setSort(undefined)
  }

  public getDvcRoots() {
    return Object.keys(this.experiments)
  }

  public getColumn(dvcRoot: string, path: string) {
    return this.getRepository(dvcRoot).getColumn(path)
  }

  public getChildColumns(dvcRoot: string, path: string) {
    return this.getRepository(dvcRoot).getChildColumns(path)
  }

  public toggleColumnStatus(dvcRoot: string, path: string) {
    return this.getRepository(dvcRoot).toggleColumnStatus(path)
  }

  public getSortedBy(): string[] {
    return []
  }

  public getFilteredBy(): string[] {
    return []
  }

  public getRunningOrQueued(dvcRoot: string): string[] {
    return this.getRepository(dvcRoot).getRunningOrQueued()
  }

  public getExperiment(dvcRoot: string, name: string) {
    return this.getRepository(dvcRoot).getExperiment(name)
  }

  public getCheckpointNames(dvcRoot: string, experimentName: string) {
    return this.getRepository(dvcRoot).getCheckpointNames(experimentName)
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
    this.experiments = reset<ExperimentsRepositories>(
      this.experiments,
      this.dispose
    )
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

  private getRepository(dvcRoot: string) {
    return this.experiments[dvcRoot]
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
      new ExperimentsRepository(dvcRoot, this.internalCommands, resourceLocator)
    )

    this.experiments[dvcRoot] = experimentsRepository

    experimentsRepository.dispose.track(
      experimentsRepository.onDidChangeIsWebviewFocused(
        dvcRoot => (this.focusedWebviewDvcRoot = dvcRoot)
      )
    )
    experimentsRepository.dispose.track(
      experimentsRepository.onDidChangeExperimentsRows(() =>
        this.experimentsRowsChanged.fire()
      )
    )

    experimentsRepository.dispose.track(
      experimentsRepository.onDidChangeExperimentsColumns(() =>
        this.experimentsColumnsChanged.fire()
      )
    )
    return experimentsRepository
  }
}
