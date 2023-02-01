import { relative } from 'path'
import { RelativePattern, Uri, workspace } from 'vscode'
import { isSameOrChild } from '.'

const joinWithForwardSlashes = (strings: string[]) =>
  strings.filter(Boolean).join('/')

const getRelativePatternForOutsideWorkspace = (
  uri: Uri,
  pattern: string
): RelativePattern => new RelativePattern(uri, pattern)

export const getRelativePattern = (
  path: string,
  pattern: string
): RelativePattern => {
  for (const workspaceFolder of workspace.workspaceFolders || []) {
    const workspaceFolderPath = workspaceFolder.uri.fsPath
    if (isSameOrChild(workspaceFolderPath, path)) {
      return new RelativePattern(
        workspaceFolder,
        joinWithForwardSlashes([relative(workspaceFolderPath, path), pattern])
      )
    }
  }

  return getRelativePatternForOutsideWorkspace(Uri.file(path), pattern)
}
