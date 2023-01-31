import { relative } from 'path'
import { utimes } from 'fs-extra'
import {
  GlobPattern,
  RelativePattern,
  Uri,
  workspace,
  WorkspaceFolder
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { isDirectory, isSameOrChild } from '.'

const getRelativePatternForOutsideWorkspace = (
  uri: Uri,
  pattern: string
): RelativePattern => new RelativePattern(uri, pattern)

const createRelativePattern = (
  folder: WorkspaceFolder,
  path: string,
  pattern: string
) => {
  return new RelativePattern(
    folder,
    `${path}${path.length > 0 ? '/' : ''}${pattern}`
  )
}

export const getRelativePattern = (
  path: string,
  pattern: string
): RelativePattern => {
  for (const workspaceFolder of workspace.workspaceFolders || []) {
    const workspaceFolderPath = workspaceFolder.uri.fsPath
    if (isSameOrChild(workspaceFolderPath, path)) {
      const relativePath = relative(workspaceFolderPath, path)
      return createRelativePattern(workspaceFolder, relativePath, pattern)
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
  track: (disposable: Disposable) => Disposable,
  glob: GlobPattern,
  listener: (path: string) => void | Promise<void>
): void => {
  if (typeof glob === 'string' && isDirectory(glob)) {
    throw new Error(
      'FileSystemWatcher will not behave as expected under these circumstances.'
    )
  }
  const fileSystemWatcher = workspace.createFileSystemWatcher(glob)
  track(fileSystemWatcher)
  track(fileSystemWatcher.onDidCreate(uri => listener(uri.fsPath)))
  track(fileSystemWatcher.onDidChange(uri => listener(uri.fsPath)))
  track(fileSystemWatcher.onDidDelete(uri => listener(uri.fsPath)))
}
