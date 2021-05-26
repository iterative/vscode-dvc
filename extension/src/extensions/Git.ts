import { Event, Extension, extensions, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'

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

export class GitExtension {
  public dispose = Disposable.fn()

  private readonly deferred = new Deferred()
  private readonly initialized = this.deferred.promise

  private gitExtensionAPI?: ExtensionAPI

  public gitRoots: string[] = []

  public isReady() {
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

    this.gitRoots = this.gitExtensionAPI.repositories.map(
      repository => repository.rootUri.fsPath
    )

    this.deferred.resolve()
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
