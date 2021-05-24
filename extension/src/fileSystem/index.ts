import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import { existsSync, lstatSync, readdir } from 'fs-extra'
import { join, resolve } from 'path'
import { ExecutionOptions } from '../cli/execution'
import { root } from '../cli/reader'
import { definedAndNonEmpty } from '../util'

export const getWatcher = (handler: (path: string) => void) => (
  path: string
): void => {
  if (path) {
    return handler(path)
  }
}

export const ignoredDotDirectories = /.*[\\|/]\.(dvc|(v)?env)[\\|/].*/

export const onDidChangeFileSystem = (
  path: string | string[],
  handler: (path: string) => void
): Disposable => {
  const watcher = getWatcher(handler)

  const debouncedWatcher = debounce(watcher, 500, {
    leading: true,
    trailing: false
  })

  const pathWatcher = chokidar.watch(path, {
    ignored: ignoredDotDirectories
  })

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

export const onDidChangeFileType = (
  path: string,
  types: string[],
  handler: (path: string) => void
): Disposable => {
  const globs = types.map(type => resolve(path, '**', type))
  return onDidChangeFileSystem(globs, handler)
}

const findDvcAbsoluteRootPath = async (
  options: ExecutionOptions
): Promise<string | undefined> => {
  try {
    const dvcRoot = await root(options)
    return resolve(options?.cwd, dvcRoot)
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
  options: ExecutionOptions
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
