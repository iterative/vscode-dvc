import { basename, extname } from 'path'
import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import { TrackedExplorerTree } from './tree'
import { Repository } from '../repository'
import { EXPERIMENTS_GIT_REFS } from '../experiments/repository'

export type FSWatcher = Disposable & {
  isReady: Promise<void>
  on: (
    event: 'add' | 'addDir' | 'change' | 'unlink',
    listener: (path: string) => void
  ) => void
  unwatch: (paths: string | readonly string[]) => void
}

const isExcluded = (path: string) =>
  !path || path.includes(EXPERIMENTS_GIT_REFS)

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

export const ignoredDotDirectories = /.*[\\|/]\.(dvc|(v)?env)[\\|/].*/

export const onReady = (
  listener: (path: string) => void,
  path: string | string[],
  pathWatcher: chokidar.FSWatcher
) => {
  pathWatcher.on('add', listener)
  pathWatcher.on('addDir', listener)
  pathWatcher.on('change', listener)
  pathWatcher.on('unlink', listener)
  pathWatcher.on('unlinkDir', listener)

  const pathToFire = Array.isArray(path) ? path[0] : path
  listener(pathToFire)
}

export const onDidChangeFileSystem = (
  path: string,
  listener: (path: string) => void
): FSWatcher => {
  const pathWatcher = chokidar.watch(path, {
    ignored: ignoredDotDirectories
  })

  const isReady = new Promise<void>(resolve =>
    pathWatcher.on('ready', () => {
      onReady(listener, path, pathWatcher)
      resolve(undefined)
    })
  )

  return {
    dispose: () => pathWatcher.close(),
    isReady,
    on: (event, listener) => pathWatcher.on(event, listener),
    unwatch: path => pathWatcher.unwatch(path)
  }
}
