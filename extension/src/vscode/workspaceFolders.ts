import { workspace } from 'vscode'
import { definedAndNonEmpty } from '../util/array'

export const getWorkspaceFolderCount = () =>
  (workspace.workspaceFolders || []).length

export const getWorkspaceFolders = (): string[] =>
  (workspace.workspaceFolders || []).map(
    workspaceFolder => workspaceFolder.uri.fsPath
  )

export const getWorkspaceRootUris = () =>
  (workspace.workspaceFolders || []).map(workspaceFolder => workspaceFolder.uri)

export const getFirstWorkspaceFolder = (): string | undefined => {
  const workspaceFolders = getWorkspaceFolders()
  return definedAndNonEmpty(workspaceFolders) ? workspaceFolders[0] : undefined
}
