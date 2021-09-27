import { basename, extname } from 'path'
import { utimes } from 'fs-extra'
import { workspace } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { watch } from 'chokidar'
import { isDirectory } from '.'
import { TrackedExplorerTree } from './tree'
import { isInWorkspace } from './workspace'
import { Repository } from '../repository'
import { EXPERIMENTS_GIT_REFS } from '../experiments/repository'

export const fireWatcher = (path: string): Promise<void> => {
  const now = new Date().getTime() / 1000
  return utimes(path, now, now)
}

export const ignoredDotDirectories = /.*[\\|/]\.(dvc|(v)?env)[\\|/].*/

const isExcluded = (path: string) =>
  !path ||
  path.includes(EXPERIMENTS_GIT_REFS) ||
  ignoredDotDirectories.test(path)

export const isDvcLock = (path: string): boolean =>
  basename(path) === 'dvc.lock'

const requiresReset = (path: string) =>
  extname(path) === '.dvc' || isDvcLock(path) || basename(path) === 'dvc.yaml'

export const getRepositoryListener =
  (
    repository: Repository,
    trackedExplorerTree: TrackedExplorerTree
  ): ((path: string) => void) =>
  (path: string) => {
    if (isExcluded(path)) {
      return
    }

    if (requiresReset(path)) {
      repository.reset()
      trackedExplorerTree.reset()
      return
    }
    repository.update()
    trackedExplorerTree.refresh(path)
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
