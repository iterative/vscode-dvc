import { workspace, WorkspaceFolder } from 'vscode'
import { definedAndNonEmpty } from '../util/array'

export const getWorkspaceFolders = (): readonly WorkspaceFolder[] =>
  workspace.workspaceFolders || []

export const getFirstWorkspaceFolderRoot = (): string | undefined => {
  const workspaceFolders = getWorkspaceFolders()
  return definedAndNonEmpty(workspaceFolders as unknown[])
    ? workspaceFolders[0].uri.fsPath
    : undefined
}
