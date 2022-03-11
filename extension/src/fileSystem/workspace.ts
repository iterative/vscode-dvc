import { basename } from 'path'
import { Uri, workspace, WorkspaceEdit } from 'vscode'
import { isSameOrChild } from '.'
import { definedAndNonEmpty } from '../util/array'
import { getWorkspaceFolders } from '../vscode/workspaceFolders'

export const deleteTarget = (uri: Uri) => {
  const edit = new WorkspaceEdit()
  edit.deleteFile(uri, { ignoreIfNotExists: true, recursive: true })
  return workspace.applyEdit(edit)
}

export const moveTargets = (targets: Uri[], destination: Uri) => {
  const edit = new WorkspaceEdit()
  for (const uri of targets) {
    edit.renameFile(uri, Uri.joinPath(destination, basename(uri.fsPath)))
  }

  return workspace.applyEdit(edit)
}

export const isInWorkspace = (pathOrGlob: string): boolean => {
  const isContained = getWorkspaceFolders()
    .map(workspaceFolder => isSameOrChild(workspaceFolder, pathOrGlob))
    .filter(Boolean)

  return definedAndNonEmpty(isContained)
}

export const findFiles = async (relativeGlob: string): Promise<string[]> => {
  const files = await workspace.findFiles(relativeGlob)
  return files.map(uri => uri.fsPath)
}
