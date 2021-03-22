import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import { accessSync } from 'fs-extra'
import debounce from 'lodash.debounce'
import { basename, dirname, join } from 'path'
import { execPromise } from './util'
import glob from 'tiny-glob'

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

const isCliGlobal = async (name: string): Promise<boolean> => {
  try {
    await execPromise(`${name} --version`)
    return true
  } catch (e) {
    return false
  }
}

const isFileAccessible = (path: string): boolean => {
  try {
    accessSync(path)
    return true
  } catch (e) {
    return false
  }
}

export const findCliPath = async (cwd: string, path: string) => {
  const cliName = basename(path)
  if (path === cliName && (await isCliGlobal(cliName))) {
    return cliName
  }

  if (isFileAccessible(path)) {
    return path
  }

  const defaultRelativePath = join(cwd, path)
  if (isFileAccessible(defaultRelativePath)) {
    return defaultRelativePath
  }

  const files = await glob(join('**', path), {
    absolute: true,
    cwd,
    dot: true,
    filesOnly: true
  })

  return files.find(file => {
    if (isFileAccessible(file)) {
      return file
    }
  })
}

export const findDvcRoots = async (cwd: string): Promise<string[]> => {
  const files = await glob(join('**', '.dvc'), {
    absolute: true,
    cwd,
    dot: true
  })

  return files.map(file => dirname(file))
}
