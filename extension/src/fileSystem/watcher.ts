import { basename, extname } from 'path'
import { workspace } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { watch } from 'chokidar'
import { isSameOrChild } from '.'
import { TrackedExplorerTree } from './tree'
import { Repository } from '../repository'
import { EXPERIMENTS_GIT_REFS } from '../experiments/repository'
import { definedAndNonEmpty } from '../util/array'
import { getWorkspaceFolders } from '../vscode/workspace'

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
  const fileSystemWatcher = workspace.createFileSystemWatcher(glob)
  fileSystemWatcher.onDidCreate(uri => listener(uri.fsPath))
  fileSystemWatcher.onDidChange(uri => listener(uri.fsPath))
  fileSystemWatcher.onDidDelete(uri => listener(uri.fsPath))

  return fileSystemWatcher
}

const createExternalToWorkspaceWatcher = (
  path: string,
  listener: () => void
): Disposable => {
  const fsWatcher = watch(path, { ignoreInitial: true })
  fsWatcher.on('all', listener)
  return { dispose: () => fsWatcher.close() }
}

export const createNecessaryFileSystemWatcher = (
  path: string,
  listener: () => void
) => {
  const isContained = getWorkspaceFolders()
    .map(workspaceFolder => isSameOrChild(workspaceFolder.uri.fsPath, path))
    .filter(Boolean)

  const canUseNative = definedAndNonEmpty(isContained)
  return canUseNative
    ? createFileSystemWatcher(path, listener)
    : createExternalToWorkspaceWatcher(path, listener)
}
