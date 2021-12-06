import { EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { DecorationProvider } from './decorationProvider'
import { RepositoryData } from './data'
import { RepositoryModel } from './model'
import { SourceControlManagement } from './sourceControlManagement'
import { InternalCommands } from '../commands/internal'

export class Repository {
  public readonly dispose = Disposable.fn()

  private readonly model: RepositoryModel
  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise
  private readonly treeDataChanged: EventEmitter<void>

  private readonly dvcRoot: string
  private readonly decorationProvider: DecorationProvider
  private readonly sourceControlManagement: SourceControlManagement
  private readonly data: RepositoryData

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    treeDataChanged: EventEmitter<void>
  ) {
    this.decorationProvider = this.dispose.track(new DecorationProvider())
    this.dvcRoot = dvcRoot
    this.model = this.dispose.track(new RepositoryModel(dvcRoot))
    this.data = this.dispose.track(
      new RepositoryData(dvcRoot, internalCommands)
    )

    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.getState())
    )

    this.treeDataChanged = treeDataChanged

    this.initialize()
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

  public update(path?: string) {
    return this.data.managedUpdate(path)
  }

  public hasChanges(): boolean {
    return this.model.hasChanges()
  }

  private async initialize() {
    this.dispose.track(
      this.data.onDidUpdate(data => {
        this.model.setState(data)
        this.setState()
        this.treeDataChanged.fire()
      })
    )

    await this.data.isReady()
    return this.deferred.resolve()
  }

  private setState() {
    this.sourceControlManagement.setState(this.getState())
    this.decorationProvider.setState(this.getState())
  }
}
