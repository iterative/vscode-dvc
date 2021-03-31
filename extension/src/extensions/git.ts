import { Event, Extension, Uri } from 'vscode'

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
  // readonly HEAD: Branch | undefined
  // readonly refs: Ref[]
  // readonly remotes: Remote[]
  // readonly submodules: Submodule[]
  // readonly rebaseCommit: Commit | undefined

  readonly mergeChanges: Change[]
  readonly indexChanges: Change[]
  readonly workingTreeChanges: Change[]

  readonly onDidChange: Event<void>
}

interface Repository {
  // readonly rootUri: Uri
  // readonly inputBox: InputBox
  readonly state: RepositoryState
  // readonly ui: RepositoryUIState

  // getConfigs(): Promise<{ key: string; value: string }[]>
  // getConfig(key: string): Promise<string>
  // setConfig(key: string, value: string): Promise<string>
  // getGlobalConfig(key: string): Promise<string>

  // getObjectDetails(
  //   treeish: string,
  //   path: string
  // ): Promise<{ mode: string; object: string; size: number }>
  // detectObjectType(
  //   object: string
  // ): Promise<{ mimetype: string; encoding?: string }>
  // buffer(ref: string, path: string): Promise<Buffer>
  // show(ref: string, path: string): Promise<string>
  // getCommit(ref: string): Promise<Commit>

  // clean(paths: string[]): Promise<void>

  // apply(patch: string, reverse?: boolean): Promise<void>
  // diff(cached?: boolean): Promise<string>
  // diffWithHEAD(): Promise<Change[]>
  // diffWithHEAD(path: string): Promise<string>
  // diffWith(ref: string): Promise<Change[]>
  // diffWith(ref: string, path: string): Promise<string>
  // diffIndexWithHEAD(): Promise<Change[]>
  // diffIndexWithHEAD(path: string): Promise<string>
  // diffIndexWith(ref: string): Promise<Change[]>
  // diffIndexWith(ref: string, path: string): Promise<string>
  // diffBlobs(object1: string, object2: string): Promise<string>
  // diffBetween(ref1: string, ref2: string): Promise<Change[]>
  // diffBetween(ref1: string, ref2: string, path: string): Promise<string>

  // hashObject(data: string): Promise<string>

  // createBranch(
  //   name: string,
  //   checkout: boolean,
  //   ref?: string
  // ): Promise<void>
  // deleteBranch(name: string, force?: boolean): Promise<void>
  // getBranch(name: string): Promise<Branch>
  // getBranches(query: BranchQuery): Promise<Ref[]>
  // setBranchUpstream(name: string, upstream: string): Promise<void>

  // getMergeBase(ref1: string, ref2: string): Promise<string>

  // status(): Promise<void>
  // checkout(treeish: string): Promise<void>

  // addRemote(name: string, url: string): Promise<void>
  // removeRemote(name: string): Promise<void>
  // renameRemote(name: string, newName: string): Promise<void>

  // fetch(options?: FetchOptions): Promise<void>
  // fetch(remote?: string, ref?: string, depth?: number): Promise<void>
  // pull(unshallow?: boolean): Promise<void>
  // push(
  //   remoteName?: string,
  //   branchName?: string,
  //   setUpstream?: boolean,
  //   force?: ForcePushMode
  // ): Promise<void>

  // blame(path: string): Promise<string>
  // log(options?: LogOptions): Promise<Commit[]>

  // commit(message: string, opts?: CommitOptions): Promise<void>
}

interface API {
  // readonly state: APIState
  // readonly onDidChangeState: Event<APIState>
  // readonly onDidPublish: Event<PublishEvent>
  // readonly git: Git
  readonly repositories: Repository[]
  // readonly onDidOpenRepository: Event<Repository>
  // readonly onDidCloseRepository: Event<Repository>
  toGitUri(uri: Uri, ref: string): Uri
  // getRepository(uri: Uri): Repository | null
  // init(root: Uri): Promise<Repository | null>
  // openRepository(root: Uri): Promise<Repository | null>
  // registerRemoteSourceProvider(provider: RemoteSourceProvider): Disposable
  // registerCredentialsProvider(provider: CredentialsProvider): Disposable
  // registerPushErrorHandler(handler: PushErrorHandler): Disposable
}

interface GitExtensionAPI {
  getAPI(version: number): Thenable<API>
}

export type GitExtension = Extension<GitExtensionAPI>
