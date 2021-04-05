import { Event, EventEmitter, Extension, extensions, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import { makeObservable, observable } from 'mobx'

export const enum GitStatus {
  INDEX_MODIFIED,
  INDEX_ADDED,
  INDEX_DELETED,
  INDEX_RENAMED,
  INDEX_COPIED,

  MODIFIED,
  DELETED,
  UNTRACKED,
  IGNORED,
  INTENT_TO_ADD,

  ADDED_BY_US,
  ADDED_BY_THEM,
  DELETED_BY_US,
  DELETED_BY_THEM,
  BOTH_ADDED,
  BOTH_DELETED,
  BOTH_MODIFIED
}

export interface Change {
  /**
   * Returns either `originalUri` or `renameUri`, depending
   * on whether this change is a rename change. When
   * in doubt always use `uri` over the other two alternatives.
   */
  readonly uri: Uri
  readonly originalUri: Uri
  readonly renameUri: Uri | undefined
  readonly status: GitStatus
}

interface RepositoryState {
  readonly mergeChanges: Change[]
  readonly indexChanges: Change[]
  readonly workingTreeChanges: Change[]

  readonly onDidChange: Event<void>
}

export interface Repository {
  readonly rootUri: Uri
  readonly state: RepositoryState
}

type APIState = 'uninitialized' | 'initialized'

interface GitExtensionAPI {
  readonly state: APIState
  readonly onDidChangeState: Event<APIState>
  readonly repositories: Repository[]

  toGitUri(uri: Uri, ref: string): Uri
}

interface GitExtension {
  getAPI(version: number): Thenable<GitExtensionAPI>
}

class GitRepository {
  public dispose = Disposable.fn()

  private onDidChangeEmitter: EventEmitter<void>
  readonly onDidChange: Event<void>

  @observable
  private repositoryState: RepositoryState

  private get workingTreeChanges() {
    return this.repositoryState.workingTreeChanges
  }

  public getUntrackedChanges() {
    return this.workingTreeChanges
      .filter(change => change.status === GitStatus.UNTRACKED)
      .map(change => change.uri.fsPath)
  }

  private repositoryRoot: string

  public getRepositoryRoot() {
    return this.repositoryRoot
  }

  constructor(repository: Repository) {
    makeObservable(this)
    this.repositoryState = repository.state
    this.repositoryRoot = repository.rootUri.fsPath

    this.onDidChangeEmitter = this.dispose.track(new EventEmitter())
    this.onDidChange = this.onDidChangeEmitter.event

    this.dispose.track(
      this.repositoryState.onDidChange(() => {
        this.repositoryState = repository.state
        this.onDidChangeEmitter.fire()
      })
    )
  }
}

export class Git {
  public dispose = Disposable.fn()

  private readonly _initialized = new Deferred()
  private readonly initialized = this._initialized.promise

  private gitExtensionAPI?: GitExtensionAPI

  @observable
  public repositories: GitRepository[] = []

  public get ready() {
    return this.initialized
  }

  private getGitExtensionAPI = async (): Promise<GitExtensionAPI> => {
    const extension = extensions.getExtension('vscode.git') as Extension<
      GitExtension
    >
    const activatedExtension = await extension.activate()
    return activatedExtension.getAPI(1)
  }

  private initializeClass(gitExtensionAPI: GitExtensionAPI) {
    this.gitExtensionAPI = gitExtensionAPI

    this.repositories = this.gitExtensionAPI.repositories.map(repository =>
      this.dispose.track(new GitRepository(repository))
    )

    this._initialized.resolve()
  }

  private initialize(extensionAPI: GitExtensionAPI) {
    if (extensionAPI.state === 'initialized') {
      return this.initializeClass(extensionAPI)
    }
    return extensionAPI.onDidChangeState(state => {
      if (state === 'initialized') {
        this.initializeClass(extensionAPI)
      }
    })
  }

  constructor() {
    makeObservable(this)
    this.getGitExtensionAPI().then(gitExtensionAPI => {
      this.initialize(gitExtensionAPI)
    })
  }
}
