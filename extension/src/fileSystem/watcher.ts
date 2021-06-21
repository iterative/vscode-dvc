import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import { TrackedExplorerTree } from './views/trackedExplorerTree'
import { Repository } from '../repository'
import { EXPERIMENTS_GIT_REFS } from '../experiments/table'

const isExcluded = (path: string) =>
  !path || path.includes(EXPERIMENTS_GIT_REFS)

const requiresReset = (path: string) =>
  extname(path) === '.dvc' ||
  basename(path) === 'dvc.lock' ||
  basename(path) === 'dvc.yaml'

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
      repository.resetState()
      trackedExplorerTree.reset()
      return
    }
    repository.updateState()
    trackedExplorerTree.refresh(path)
  }

export const ignoredDotDirectories = /.*[\\|/]\.(dvc|(v)?env)[\\|/].*/

export const onReady = (
  debouncedWatcher: (path: string) => void,
  path: string | string[],
  pathWatcher: chokidar.FSWatcher
) => {
  pathWatcher.on('add', debouncedWatcher)
  pathWatcher.on('addDir', debouncedWatcher)
  pathWatcher.on('change', debouncedWatcher)
  pathWatcher.on('unlink', debouncedWatcher)
  pathWatcher.on('unlinkDir', debouncedWatcher)

  const pathToFire = Array.isArray(path) ? path[0] : path
  debouncedWatcher(pathToFire)
}

export const onDidChangeFileSystem = (
  path: string,
  watcher: (path: string) => void
): Disposable => {
  const debouncedWatcher = debounce(watcher, 500, {
    leading: true,
    trailing: false
  })

  const pathWatcher = chokidar.watch(path, {
    ignored: ignoredDotDirectories
  })

  pathWatcher.on('ready', () => onReady(debouncedWatcher, path, pathWatcher))

  return {
    dispose: () => {
      pathWatcher.close()
    }
  }
}
