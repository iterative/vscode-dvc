import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import { existsSync, lstatSync, readdir } from 'fs-extra'
import { join, resolve } from 'path'
import { ReaderOptions } from './cli/execution'
import { getRoot } from './cli/reader'
import { definedAndNonEmpty } from './util'
import { window } from 'vscode'

export const getWatcher = (handler: (path: string) => void) => (
  path: string
): void => {
  if (path) {
    return handler(path)
  }
}

export const matchDotDirectoryPath = /.*?[\\|/]\.\S+[\\|/].*/

export const addOnFileSystemChangeHandler = (
  path: string,
  handler: (path: string) => void
): Disposable => {
  const watcher = getWatcher(handler)

  const debouncedWatcher = debounce(watcher, 500, {
    leading: true,
    trailing: false
  })

  const pathWatcher = chokidar.watch(path, {
    ignored: matchDotDirectoryPath
  })

  pathWatcher.on('ready', debouncedWatcher)
  pathWatcher.on('add', debouncedWatcher)
  pathWatcher.on('addDir', debouncedWatcher)
  pathWatcher.on('change', debouncedWatcher)
  pathWatcher.on('unlink', debouncedWatcher)
  pathWatcher.on('unlinkDir', debouncedWatcher)

  return {
    dispose: () => {
      pathWatcher.close()
    }
  }
}

const findDvcAbsoluteRootPath = async (
  options: ReaderOptions
): Promise<string | undefined> => {
  try {
    const root = await getRoot(options)
    return resolve(options?.cwd, root)
  } catch (e) {}
}

export const exists = (path: string): boolean => existsSync(path)

export const isDirectory = (path: string): boolean => {
  try {
    return lstatSync(path).isDirectory()
  } catch {
    return false
  }
}

export const findDvcSubRootPaths = async (
  cwd: string
): Promise<string[] | undefined> => {
  if (isDirectory(join(cwd, '.dvc'))) {
    return [cwd]
  }
  const children = await readdir(cwd)

  return children
    .filter(child => isDirectory(join(cwd, child, '.dvc')))
    .map(child => join(cwd, child))
}

export const findDvcRootPaths = async (
  options: ReaderOptions
): Promise<string[]> => {
  const subRoots = await findDvcSubRootPaths(options.cwd)

  if (definedAndNonEmpty(subRoots)) {
    return subRoots
  }

  const absoluteRoot = await findDvcAbsoluteRootPath(options)

  if (!absoluteRoot) {
    return []
  }

  return [absoluteRoot]
}

export const pickSingleRepositoryRoot = async (
  options: ReaderOptions,
  providedRoot?: string
): Promise<string | undefined> => {
  if (providedRoot) {
    return providedRoot
  }

  const dvcRoots = await findDvcRootPaths(options)
  if (dvcRoots.length === 1) {
    return dvcRoots[0]
  }

  return window.showQuickPick(dvcRoots, {
    canPickMany: false,
    placeHolder: 'Select which repository to run experiments in'
  })
}
