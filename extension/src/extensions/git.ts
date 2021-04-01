import { Event, EventEmitter, Extension, extensions, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'

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

interface Change {
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

interface Repository {
  readonly rootUri: Uri
  readonly state: RepositoryState
}

type APIState = 'uninitialized' | 'initialized'

interface API {
  readonly state: APIState
  readonly onDidChangeState: Event<APIState>
  readonly repositories: Repository[]

  toGitUri(uri: Uri, ref: string): Uri
}

interface GitExtensionAPI {
  getAPI(version: number): Thenable<API>
}

export type GitExtension = Extension<GitExtensionAPI>

export class Git {
  dispose = Disposable.fn()
  private readonly _initialized = new Deferred()

  private readonly initialized = this._initialized.promise

  repositories: Repository[] = []
  private externalApi?: API
  repositoriesState: RepositoryState[] = []

  public get ready() {
    return this.initialized
  }

  private getExtensionAPI = async (): Promise<API> => {
    const extension = extensions.getExtension('vscode.git') as GitExtension
    const activatedExtension = await extension.activate()
    return activatedExtension.getAPI(1)
  }

  private onDidChangeEmitter: EventEmitter<Uri[]>
  readonly onDidChange: Event<Uri[]>

  private getUntrackedChanges(changes: Change[]): Uri[] {
    return changes
      .filter(change => change.status === GitStatus.UNTRACKED)
      .map(change => change.uri)
  }

  private initialize(gitExtensionAPI: API) {
    this.externalApi = gitExtensionAPI
    this.repositories = this.externalApi.repositories
    this.repositoriesState = this.externalApi.repositories.map(
      repository => repository.state
    )
    this.repositoriesState.map(state => {
      this.dispose.track(
        state.onDidChange(() => {
          const uris = [
            ...this.getUntrackedChanges(state.mergeChanges),
            ...this.getUntrackedChanges(state.indexChanges),
            ...this.getUntrackedChanges(state.workingTreeChanges)
          ]
          this.onDidChangeEmitter.fire(uris)
        })
      )
    })
    this._initialized.resolve()
  }

  private setup(gitExtensionAPI: API) {
    if (gitExtensionAPI.state === 'initialized') {
      this.initialize(gitExtensionAPI)
      this._initialized.resolve()
    } else {
      gitExtensionAPI.onDidChangeState(state => {
        if (state === 'initialized') {
          this.initialize(gitExtensionAPI)
        }
      })
    }
  }

  constructor() {
    this.onDidChangeEmitter = this.dispose.track(new EventEmitter())
    this.onDidChange = this.onDidChangeEmitter.event

    this.getExtensionAPI().then(gitExtensionAPI => {
      this.setup(gitExtensionAPI)
    })
  }
}
