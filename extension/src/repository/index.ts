import { basename, extname } from 'path'
import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { SourceControlManagement } from './sourceControlManagement'
import { DecorationProvider } from './decorationProvider'
import { RepositoryModel } from './model'
import { ListOutput, DiffOutput, StatusOutput } from '../cli/reader'
import { getAllUntracked } from '../git'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { ProcessManager } from '../processManager'

export const isAnyDvcYaml = (path?: string): boolean =>
  !!(
    path &&
    (extname(path) === '.dvc' ||
      basename(path) === 'dvc.lock' ||
      basename(path) === 'dvc.yaml')
  )

export class Repository {
  public readonly dispose = Disposable.fn()
  public readonly onDidChangeTreeData: Event<void>

  private model: RepositoryModel
  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise
  private readonly treeDataChanged: EventEmitter<void>

  private readonly dvcRoot: string
  private readonly internalCommands: InternalCommands
  private decorationProvider: DecorationProvider
  private readonly sourceControlManagement: SourceControlManagement

  private processManager: ProcessManager

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    decorationProvider = new DecorationProvider(),
    treeDataChanged = new EventEmitter<void>()
  ) {
    this.internalCommands = internalCommands
    this.decorationProvider = this.dispose.track(decorationProvider)
    this.dvcRoot = dvcRoot
    this.model = this.dispose.track(new RepositoryModel(dvcRoot))

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.getState())
    )

    this.processManager = this.dispose.track(
      new ProcessManager(
        { name: 'update', process: () => this.updateData() },
        { name: 'reset', process: () => this.resetData() }
      )
    )

    this.treeDataChanged = this.dispose.track(treeDataChanged)
    this.onDidChangeTreeData = this.treeDataChanged.event

    this.setup()
  }

  public isReady() {
    return this.initialized
  }

  public getState() {
    return this.model.getState()
  }

  public getChildren(path: string) {
    return this.model.getChildren(path)
  }

  public update(path?: string): Promise<void> {
    if (isAnyDvcYaml(path) || this.processManager.isOngoingOrQueued('reset')) {
      return this.processManager.run('reset')
    }

    return this.processManager.run('update')
  }

  public hasChanges(): boolean {
    return this.model.hasChanges()
  }

  private async resetData() {
    const [diffFromHead, diffFromCache, untracked, tracked] =
      await this.getResetData()

    this.model.setState({ diffFromCache, diffFromHead, tracked, untracked })

    this.setState()
    this.treeDataChanged.fire()
  }

  private async updateData() {
    const [diffFromHead, diffFromCache, untracked] = await this.getUpdateData()

    this.model.setState({ diffFromCache, diffFromHead, untracked })
    this.setState()
  }

  private async getUpdateData(): Promise<
    [DiffOutput, StatusOutput, Set<string>]
  > {
    const statusOutput =
      await this.internalCommands.executeCommand<StatusOutput>(
        AvailableCommands.STATUS,
        this.dvcRoot
      )

    const diffOutput = await this.internalCommands.executeCommand<DiffOutput>(
      AvailableCommands.DIFF,
      this.dvcRoot
    )

    const gitOutput = await getAllUntracked(this.dvcRoot)

    return [diffOutput, statusOutput, gitOutput]
  }

  private async getResetData(): Promise<
    [DiffOutput, StatusOutput, Set<string>, ListOutput[]]
  > {
    const listOutput = await this.internalCommands.executeCommand<ListOutput[]>(
      AvailableCommands.LIST_DVC_ONLY_RECURSIVE,
      this.dvcRoot
    )

    const [diffOutput, statusOutput, gitOutput] = await this.getUpdateData()

    return [diffOutput, statusOutput, gitOutput, listOutput]
  }

  private setState() {
    this.sourceControlManagement.setState(this.getState())
    this.decorationProvider.setState(this.getState())
  }

  private async setup() {
    await this.processManager.run('reset')
    return this.deferred.resolve()
  }
}
