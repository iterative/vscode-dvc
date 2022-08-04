import { TextDocument, workspace, WorkspaceFolder } from 'vscode'

export const getWorkspaceFolders = (): readonly WorkspaceFolder[] =>
  workspace.workspaceFolders || []

export const getWorkspaceFiles = (): readonly TextDocument[] =>
  workspace.textDocuments
