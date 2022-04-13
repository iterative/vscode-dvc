import { EventEmitter } from 'vscode'
import { DecorationProvider } from './decorationProvider'
import { RepositoryData } from './data'
import { RepositoryModel } from './model'
import { SourceControlManagement } from './sourceControlManagement'
import { InternalCommands } from '../commands/internal'
import { DeferredDisposable } from '../class/deferred'

export const RepositoryCounts = {
  TRACKED: 'tracked'
} as const

export class Repository extends DeferredDisposable {
  private readonly model: RepositoryModel
  private readonly treeDataChanged: EventEmitter<void>

  private readonly dvcRoot: string
  private readonly decorationProvider: DecorationProvider
  private readonly sourceControlManagement: SourceControlManagement
  private readonly data: RepositoryData

  constructor(
    dvcRoot: string,
    internalCommands: InternalCommands,
    updatesPaused: EventEmitter<boolean>,
    treeDataChanged: EventEmitter<void>
  ) {
    super()

    this.dvcRoot = dvcRoot
    this.model = this.dispose.track(new RepositoryModel(dvcRoot))
    this.data = this.dispose.track(
      new RepositoryData(dvcRoot, internalCommands, updatesPaused)
    )

    this.decorationProvider = this.dispose.track(new DecorationProvider())
    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, this.getState())
    )

    this.treeDataChanged = treeDataChanged

    this.initialize()
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

  public getCounts() {
    return { tracked: this.getState().tracked.size }
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
