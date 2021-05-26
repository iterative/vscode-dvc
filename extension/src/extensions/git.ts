import { Extension, extensions, Uri } from 'vscode'

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
  const extension = extensions.getExtension('vscode.git') as Extension<
    VscodeGit
  >
  const activatedExtension = await extension.activate()
  const api = await activatedExtension.getAPI(1)

  return api.repositories.map(repository => repository.rootUri.fsPath)
}
