import { Event, Uri } from 'vscode'
import { getExtensionAPI } from '../vscode/extensions'

const enum Status {
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
  INTENT_TO_RENAME,
  TYPE_CHANGED,

  ADDED_BY_US,
  ADDED_BY_THEM,
  DELETED_BY_US,
  DELETED_BY_THEM,
  BOTH_ADDED,
  BOTH_DELETED,
  BOTH_MODIFIED
}

type Change = {
  readonly uri: Uri
  readonly originalUri: Uri
  readonly renameUri: Uri | undefined
  readonly status: Status
}

export type RepositoryState = {
  readonly mergeChanges: Change[]
  readonly indexChanges: Change[]
  readonly workingTreeChanges: Change[]
  readonly onDidChange: Event<void>
}

type Repository = {
  readonly rootUri: Uri
  readonly state: RepositoryState
}

enum APIState {
  INITIALIZED = 'initialized',
  UNINITIALIZED = 'uninitialized'
}

type ExtensionAPI = {
  readonly state: APIState
  readonly onDidChangeState: Event<APIState>
  getRepository(uri: Uri): Repository | null
}

type VscodeGit = {
  readonly enabled: boolean
  readonly onDidChangeEnablement: Event<boolean>

  getAPI(version: number): Thenable<ExtensionAPI>
}

const isReady = (api: ExtensionAPI) =>
  new Promise(resolve => {
    const listener = api.onDidChangeState(state => {
      if (state === APIState.INITIALIZED) {
        listener.dispose()
        resolve(undefined)
      }
    })

    if (api.state === APIState.INITIALIZED) {
      listener.dispose()
      resolve(undefined)
    }
  })

export const getGitExtensionAPI = async (): Promise<
  ExtensionAPI | undefined
> => {
  const extension = await getExtensionAPI<VscodeGit>('vscode.git')
  if (!extension) {
    return
  }
  const api = await extension.getAPI(1)

  await isReady(api)
  return api
}
