import { Uri, workspace, WorkspaceEdit } from 'vscode'

export const deletePath = (path: string) => {
  const edit = new WorkspaceEdit()
  edit.deleteFile(Uri.file(path), { ignoreIfNotExists: true, recursive: true })
  return workspace.applyEdit(edit)
}
