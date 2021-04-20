import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import { lstatSync } from 'fs'
import { readdir } from 'fs-extra'
import { join, resolve } from 'path'
import { getRoot } from './cli/reader'
import { definedAndNonEmpty } from './util'

export const getWatcher = (handler: () => void) => (path: string): void => {
  if (path) {
    return handler()
  }
}

export const addFileChangeHandler = (
  file: string,
  handler: () => void
): Disposable => {
  const watcher = getWatcher(handler)

  const debouncedWatcher = debounce(watcher, 500, {
    leading: false,
    trailing: true
  })

  const fileWatcher = chokidar.watch(file)

  fileWatcher.on('ready', debouncedWatcher)
  fileWatcher.on('add', debouncedWatcher)
  fileWatcher.on('change', debouncedWatcher)
  fileWatcher.on('unlink', debouncedWatcher)

  return {
    dispose: () => {
      fileWatcher.close()
    }
  }
}

const findDvcAbsoluteRootPath = async (
  cwd: string,
  cliPath: string | undefined,
  pythonBinPath: string | undefined
): Promise<string | undefined> => {
  try {
    const root = await getRoot({
      cliPath,
      cwd,
      pythonBinPath
    })
    return resolve(cwd, root)
  } catch (e) {}
}

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
  cwd: string,
  cliPath: string | undefined,
  pythonBinPath: string | undefined
): Promise<string[]> => {
  const subRoots = await findDvcSubRootPaths(cwd)

  if (definedAndNonEmpty(subRoots)) {
    return subRoots
  }

  const absoluteRoot = await findDvcAbsoluteRootPath(
    cwd,
    cliPath,
    pythonBinPath
  )

  if (!absoluteRoot) {
    return []
  }

  return [absoluteRoot]
}
