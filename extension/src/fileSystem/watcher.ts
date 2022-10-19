import { join, relative } from 'path'
import { utimes } from 'fs-extra'
import { GlobPattern, RelativePattern, Uri, workspace } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { isDirectory, isSameOrChild } from '.'

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
        join(relative(workspaceFolderPath, path), pattern)
      )
    }
  }

  return getRelativePatternForOutsideWorkspace(Uri.file(path), pattern)
}

export const fireWatcher = (path: string): Promise<void> => {
  const now = Date.now() / 1000
  return utimes(path, now, now)
}

export const ignoredDotDirectories = /.*[/\\|]\.(dvc|(v)?env)[/\\|].*/

export const createFileSystemWatcher = (
  glob: GlobPattern,
  listener: (path: string) => void
): Disposable => {
  if (typeof glob === 'string' && isDirectory(glob)) {
    throw new Error(
      'FileSystemWatcher will not behave as expected under these circumstances.'
    )
  }
  const fileSystemWatcher = workspace.createFileSystemWatcher(glob)
  fileSystemWatcher.onDidCreate(uri => listener(uri.fsPath))
  fileSystemWatcher.onDidChange(uri => listener(uri.fsPath))
  fileSystemWatcher.onDidDelete(uri => listener(uri.fsPath))

  return fileSystemWatcher
}
