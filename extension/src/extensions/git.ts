import { Uri } from 'vscode'
import { getExtension } from '../vscode/extensions'

interface Repository {
  readonly rootUri: Uri
}

interface ExtensionAPI {
  readonly repositories: Repository[]
}

interface VscodeGit {
  getAPI(version: number): Thenable<ExtensionAPI>
}

export const getGitRepositoryRoots = async (): Promise<string[]> => {
  const extension = await getExtension<VscodeGit>('vscode.git')
  if (!extension) {
    return []
  }
  const api = await extension.getAPI(1)

  return api.repositories.map(repository => repository.rootUri.fsPath)
}
