import { EventEmitter } from 'vscode'
import { DecorationProvider, DecorationState } from './decorationProvider'
import { RepositoryData } from './data'
import { RepositoryModel } from './model'
import {
  SourceControlManagement,
  SourceControlManagementState
} from './sourceControlManagement'
import { InternalCommands } from '../commands/internal'
import { DeferredDisposable } from '../class/deferred'

export const RepositoryScale = {
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
      new SourceControlManagement(this.dvcRoot, {
        committed: [],
        notInCache: [],
        uncommitted: [],
        untracked: []
      })
    )

    this.treeDataChanged = treeDataChanged

    this.initialize()
  }

  public getChildren(path: string) {
    return this.model.getChildren(path)
  }

  public update() {
    return this.data.managedUpdate()
  }

  public hasChanges(): boolean {
    return this.model.getHasChanges()
  }

  public getScale() {
    return { tracked: this.model.getScale() }
  }

  private async initialize() {
    this.dispose.track(
      this.data.onDidUpdate(data => {
        const state = this.model.setState(data)
        this.setState(state)
        this.treeDataChanged.fire()
      })
    )

    await this.data.isReady()
    return this.deferred.resolve()
  }

  private setState({
    decorationState,
    sourceControlManagementState
  }: {
    decorationState: DecorationState
    sourceControlManagementState: SourceControlManagementState
  }) {
    this.sourceControlManagement.setState(sourceControlManagementState)
    this.decorationProvider.setState(decorationState)
  }
}
