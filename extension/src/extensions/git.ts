import { Event, Uri } from 'vscode'
import { getExtensionAPI } from '../vscode/extensions'

interface Repository {
  readonly rootUri: Uri
}

export enum APIState {
  INITIALIZED = 'initialized',
  UNINITIALIZED = 'uninitialized'
}

interface ExtensionAPI {
  readonly state: APIState
  readonly onDidChangeState: Event<APIState>
  readonly repositories: Repository[]
}

interface VscodeGit {
  getAPI(version: number): Thenable<ExtensionAPI>
}

export const isReady = (api: ExtensionAPI) =>
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

export const getGitRepositoryRoots = async (): Promise<string[]> => {
  const extension = await getExtensionAPI<VscodeGit>('vscode.git')
  if (!extension) {
    return []
  }
  const api = await extension.getAPI(1)

  await isReady(api)

  return api.repositories.map(repository => repository.rootUri.fsPath)
}
