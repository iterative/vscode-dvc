import { join } from 'path'
import { utimes } from 'fs-extra'
import { workspace } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { watch } from 'chokidar'
import { isDirectory } from '.'
import { isInWorkspace } from './workspace'

export const fireWatcher = (path: string): Promise<void> => {
  const now = new Date().getTime() / 1000
  return utimes(path, now, now)
}

export const ignoredDotDirectories = /.*[\\|/]\.(dvc|(v)?env)[\\|/].*/

export const createFileSystemWatcher = (
  glob: string,
  listener: (path: string) => void
): Disposable => {
  if (isDirectory(glob)) {
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

const createExpensiveWatcher = (
  paths: string[],
  listener: (path: string) => void
): Disposable => {
  const fsWatcher = watch(paths, {
    ignoreInitial: true,
    ignored: ignoredDotDirectories
  })

  fsWatcher.on('all', (_, path) => listener(path))
  return { dispose: () => fsWatcher.close() }
}

export const createNecessaryFileSystemWatcher = (
  cwd: string,
  paths: string[],
  listener: (glob: string) => void
): Disposable => {
  const canUseNative = isInWorkspace(cwd)

  const globForInexpensive = join(cwd, '**')
  const explicitPaths = paths.map(path => join(cwd, path))

  return canUseNative
    ? createFileSystemWatcher(globForInexpensive, listener)
    : createExpensiveWatcher(explicitPaths, listener)
}
