import { utimes } from 'fs-extra'
import { workspace } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { watch } from 'chokidar'
import { isAnyDvcYaml, isDirectory } from '.'
import { isInWorkspace } from './workspace'
import { Repository } from '../repository'
import { EXPERIMENTS_GIT_REFS } from '../experiments/data/constants'

export const fireWatcher = (path: string): Promise<void> => {
  const now = new Date().getTime() / 1000
  return utimes(path, now, now)
}

export const ignoredDotDirectories = /.*[\\|/]\.(dvc|(v)?env)[\\|/].*/

const isExcluded = (dvcRoot: string, path: string) =>
  !path ||
  !(
    path.includes(dvcRoot) ||
    (path.includes('.git') && (path.includes('HEAD') || path.includes('index')))
  ) ||
  path.includes(EXPERIMENTS_GIT_REFS) ||
  ignoredDotDirectories.test(path)

export const getRepositoryListener =
  (repository: Repository, dvcRoot: string): ((path: string) => void) =>
  (path: string) => {
    if (isExcluded(dvcRoot, path)) {
      return
    }

    if (isAnyDvcYaml(path)) {
      repository.reset()
      return
    }
    repository.update()
  }

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

const createExternalToWorkspaceWatcher = (
  glob: string,
  listener: (path: string) => void
): Disposable => {
  const fsWatcher = watch(glob, { ignoreInitial: true })
  fsWatcher.on('all', (_, path) => listener(path))
  return { dispose: () => fsWatcher.close() }
}

export const createNecessaryFileSystemWatcher = (
  glob: string,
  listener: (glob: string) => void
): Disposable => {
  const canUseNative = isInWorkspace(glob)

  return canUseNative
    ? createFileSystemWatcher(glob, listener)
    : createExternalToWorkspaceWatcher(glob, listener)
}
