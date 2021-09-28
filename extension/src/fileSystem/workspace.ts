import { basename, join } from 'path'
import { Uri, workspace, WorkspaceEdit } from 'vscode'
import { isSameOrChild } from '.'
import { definedAndNonEmpty } from '../util/array'
import { getWorkspaceFolders } from '../vscode/workspaceFolders'

export const deleteTarget = (path: string) => {
  const edit = new WorkspaceEdit()
  edit.deleteFile(Uri.file(path), { ignoreIfNotExists: true, recursive: true })
  return workspace.applyEdit(edit)
}

export const moveTargets = (paths: string[], destination: string) => {
  const edit = new WorkspaceEdit()
  paths.forEach(path =>
    edit.renameFile(Uri.file(path), Uri.file(join(destination, basename(path))))
  )
  return workspace.applyEdit(edit)
}

export const isInWorkspace = (pathOrGlob: string): boolean => {
  const isContained = getWorkspaceFolders()
    .map(workspaceFolder => isSameOrChild(workspaceFolder, pathOrGlob))
    .filter(Boolean)

  return definedAndNonEmpty(isContained)
}
