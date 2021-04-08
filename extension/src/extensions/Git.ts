import { Event, EventEmitter, Extension, extensions, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'
import isEqual from 'lodash.isequal'
import { makeObservable, observable } from 'mobx'

const enum GitStatus {
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

interface ExtensionAPI {
  readonly state: APIState
  readonly onDidChangeState: Event<APIState>
  readonly repositories: Repository[]

  toGitUri(uri: Uri, ref: string): Uri
}

interface VscodeGit {
  getAPI(version: number): Thenable<ExtensionAPI>
}

class GitExtensionRepository {
  public dispose = Disposable.fn()

  private onDidUntrackedChangeEmitter: EventEmitter<void>
  readonly onDidUntrackedChange: Event<void>

  @observable
  private untrackedChanges: string[]

  private getUntrackedChanges(changes: Change[]): string[] {
    return changes
      .filter(change => change.status === GitStatus.UNTRACKED)
      .map(change => change.uri.fsPath)
      .sort()
  }

  private repositoryRoot: string

  public getRepositoryRoot() {
    return this.repositoryRoot
  }

  constructor(repository: Repository) {
    makeObservable(this)
    this.repositoryRoot = repository.rootUri.fsPath

    this.untrackedChanges = this.getUntrackedChanges(
      repository.state.workingTreeChanges
    )

    this.onDidUntrackedChangeEmitter = this.dispose.track(new EventEmitter())
    this.onDidUntrackedChange = this.onDidUntrackedChangeEmitter.event

    this.dispose.track(
      repository.state.onDidChange(() => {
        const currentUntrackedChanges = this.getUntrackedChanges(
          repository.state.workingTreeChanges
        )
        if (!isEqual(this.untrackedChanges, currentUntrackedChanges)) {
          this.untrackedChanges = currentUntrackedChanges
          this.onDidUntrackedChangeEmitter.fire()
        }
      })
    )
  }
}

export class GitExtension {
  public dispose = Disposable.fn()

  private readonly _initialized = new Deferred()
  private readonly initialized = this._initialized.promise

  private gitExtensionAPI?: ExtensionAPI

  public repositories: GitExtensionRepository[] = []

  public get ready() {
    return this.initialized
  }

  private getExtensionAPI = async (): Promise<ExtensionAPI> => {
    const extension = extensions.getExtension('vscode.git') as Extension<
      VscodeGit
    >
    const activatedExtension = await extension.activate()
    return activatedExtension.getAPI(1)
  }

  private initializeClass(gitExtensionAPI: ExtensionAPI) {
    this.gitExtensionAPI = gitExtensionAPI

    this.repositories = this.gitExtensionAPI.repositories.map(repository =>
      this.dispose.track(new GitExtensionRepository(repository))
    )

    this._initialized.resolve()
  }

  private initialize(extensionAPI: ExtensionAPI) {
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
    this.getExtensionAPI().then(gitExtensionAPI => {
      this.initialize(gitExtensionAPI)
    })
  }
}
