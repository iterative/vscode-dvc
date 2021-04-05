import { Event, EventEmitter, Extension, extensions, Uri } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'

interface RepositoryState {
  readonly onDidChange: Event<void>
}

interface Repository {
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

class GitExtensionRepository {
  public dispose = Disposable.fn()

  private onDidChangeEmitter: EventEmitter<void>
  readonly onDidChange: Event<void>

  private repositoryRoot: string

  public getRepositoryRoot() {
    return this.repositoryRoot
  }

  constructor(repository: Repository) {
    this.repositoryRoot = repository.rootUri.fsPath

    this.onDidChangeEmitter = this.dispose.track(new EventEmitter())
    this.onDidChange = this.onDidChangeEmitter.event

    this.dispose.track(
      repository.state.onDidChange(() => {
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

  public repositories: GitExtensionRepository[] = []

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
      this.dispose.track(new GitExtensionRepository(repository))
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
    this.getGitExtensionAPI().then(gitExtensionAPI => {
      this.initialize(gitExtensionAPI)
    })
  }
}
