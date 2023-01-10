import { EventEmitter } from 'vscode'
import { DecorationProvider as ErrorDecorationProvider } from './model/decorationProvider'
import {
  DecorationProvider as ScmDecorationProvider,
  ScmDecorationState
} from './sourceControlManagement/decorationProvider'
import { RepositoryData } from './data'
import { RepositoryModel } from './model'
import { SourceControlManagement, SCMState } from './sourceControlManagement'
import { InternalCommands } from '../commands/internal'
import { DeferredDisposable } from '../class/deferred'

export const RepositoryScale = {
  TRACKED: 'tracked'
} as const

export class Repository extends DeferredDisposable {
  private readonly model: RepositoryModel
  private readonly treeDataChanged: EventEmitter<void>

  private readonly dvcRoot: string
  private readonly errorDecorationProvider: ErrorDecorationProvider
  private readonly scmDecorationProvider: ScmDecorationProvider
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

    this.errorDecorationProvider = this.dispose.track(
      new ErrorDecorationProvider()
    )
    this.scmDecorationProvider = this.dispose.track(new ScmDecorationProvider())
    this.sourceControlManagement = this.dispose.track(
      new SourceControlManagement(this.dvcRoot, {
        committed: [],
        notInCache: [],
        uncommitted: [],
        untracked: []
      })
    )

    this.treeDataChanged = treeDataChanged

    void this.initialize()
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
        const state = this.model.transformAndSet(data)
        this.notifyChanged(state)
      })
    )

    await this.data.isReady()
    return this.deferred.resolve()
  }

  private notifyChanged({
    errorDecorationState,
    scmDecorationState,
    sourceControlManagementState
  }: {
    scmDecorationState: ScmDecorationState
    errorDecorationState?: Set<string>
    sourceControlManagementState: SCMState
  }) {
    this.treeDataChanged.fire()
    this.sourceControlManagement.setState(sourceControlManagementState)
    this.scmDecorationProvider.setState(scmDecorationState)
    if (errorDecorationState) {
      this.errorDecorationProvider.setState(errorDecorationState)
    }
  }
}
