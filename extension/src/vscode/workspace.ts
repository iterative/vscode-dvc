import { workspace, WorkspaceFolder } from 'vscode'

export const getWorkspaceFolders = (): readonly WorkspaceFolder[] =>
  workspace.workspaceFolders || []
