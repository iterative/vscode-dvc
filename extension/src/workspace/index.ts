import { Uri, workspace, WorkspaceEdit } from 'vscode'

export const deletePath = (uri: Uri) => {
  const edit = new WorkspaceEdit()
  edit.deleteFile(uri, { ignoreIfNotExists: true, recursive: true })
  return workspace.applyEdit(edit)
}
