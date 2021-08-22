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

export const getGitRepositoryRoots = async () => {
  const extension = getExtension<VscodeGit>('vscode.git')
  const activatedExtension = await extension.activate()
  const api = await activatedExtension.getAPI(1)

  return api.repositories.map(repository => repository.rootUri.fsPath)
}
