import { Uri, workspace, WorkspaceEdit } from 'vscode'

export const deletePath = (path: string) => {
  const edit = new WorkspaceEdit()
  edit.deleteFile(Uri.file(path), { recursive: true, ignoreIfNotExists: true })
  return workspace.applyEdit(edit)
}
