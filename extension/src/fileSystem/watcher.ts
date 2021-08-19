import { basename, extname } from 'path'
import { FileSystemWatcher, workspace } from 'vscode'
import { TrackedExplorerTree } from './tree'
import { Repository } from '../repository'
import { EXPERIMENTS_GIT_REFS } from '../experiments/repository'

export const ignoredDotDirectories = /.*[\\|/]\.(dvc|(v)?env)[\\|/].*/

const isExcluded = (path: string) =>
  !path ||
  path.includes(EXPERIMENTS_GIT_REFS) ||
  ignoredDotDirectories.test(path)

export const isDvcLock = (path: string): boolean =>
  basename(path) === 'dvc.lock'

const requiresReset = (path: string) =>
  extname(path) === '.dvc' || isDvcLock(path) || basename(path) === 'dvc.yaml'

export const getRepositoryWatcher =
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
): FileSystemWatcher => {
  const pathWatcher = workspace.createFileSystemWatcher(glob)
  pathWatcher.onDidCreate(uri => listener(uri.fsPath))
  pathWatcher.onDidChange(uri => listener(uri.fsPath))
  pathWatcher.onDidDelete(uri => listener(uri.fsPath))

  return pathWatcher
}
