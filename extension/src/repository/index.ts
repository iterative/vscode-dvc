import { EventEmitter, Uri } from 'vscode'
import {
  DecorationProvider as ScmDecorationProvider,
  ScmDecorationState
} from './sourceControlManagement/decorationProvider'
import { RepositoryData } from './data'
import { RepositoryModel } from './model'
import { SourceControlManagement, SCMState } from './sourceControlManagement'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { DeferredDisposable } from '../class/deferred'
import { ErrorDecorationProvider } from '../tree/decorationProvider/error'
import { DecoratableTreeItemScheme } from '../tree'
import { getGitExtensionAPI } from '../extensions/git'

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
    treeDataChanged: EventEmitter<void>,
    subProjects: string[]
  ) {
    super()

    this.dvcRoot = dvcRoot

    this.model = this.dispose.track(new RepositoryModel(dvcRoot))
    this.data = this.dispose.track(
      new RepositoryData(dvcRoot, internalCommands, subProjects)
    )

    this.errorDecorationProvider = this.dispose.track(
      new ErrorDecorationProvider(DecoratableTreeItemScheme.TRACKED)
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

    void Promise.all([
      this.watchGitExtension(internalCommands),
      this.initializeData()
    ]).then(() => this.deferred.resolve())
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

  private initializeData() {
    this.dispose.track(
      this.data.onDidUpdate(data => {
        const state = this.model.transformAndSetCli(data)
        this.notifyChanged(state)
      })
    )

    return this.data.isReady()
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
    this.errorDecorationProvider.setState(errorDecorationState)
  }

  private async watchGitExtension(internalCommands: InternalCommands) {
    const gitRoot = await internalCommands.executeCommand(
      AvailableCommands.GIT_GET_REPOSITORY_ROOT,
      this.dvcRoot
    )

    const api = await getGitExtensionAPI()
    if (!api) {
      return
    }
    const repository = api.getRepository(Uri.file(gitRoot))
    if (!repository) {
      return
    }

    this.dispose.track(
      repository.state.onDidChange(() =>
        this.model.transformAndSetGit(repository.state)
      )
    )

    return this.model.transformAndSetGit(repository.state)
  }
}
