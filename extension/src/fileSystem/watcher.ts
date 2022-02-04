import { utimes } from 'fs-extra'
import { GlobPattern, workspace } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { isDirectory } from '.'

export const fireWatcher = (path: string): Promise<void> => {
  const now = new Date().getTime() / 1000
  return utimes(path, now, now)
}

export const ignoredDotDirectories = /.*[\\|/]\.(dvc|(v)?env)[\\|/].*/

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
