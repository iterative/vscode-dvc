import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import { accessSync } from 'fs-extra'
import debounce from 'lodash.debounce'
import { basename, join } from 'path'
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

const isBinaryAccessible = async (bin: string): Promise<boolean> => {
  try {
    await execPromise(`${bin} --version`)
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

export const findBinaryPath = async (cwd: string, relativePath: string) => {
  const filename = basename(relativePath)
  if (await isBinaryAccessible(filename)) {
    return filename
  }

  if (isFileAccessible(relativePath)) {
    return relativePath
  }

  const defaultRelativePath = join(cwd, relativePath)
  if (isFileAccessible(defaultRelativePath)) {
    return defaultRelativePath
  }

  const files = await glob(join('**', relativePath), {
    absolute: true,
    cwd,
    dot: true
  })

  return files.find(file => {
    if (isFileAccessible(file)) {
      return file
    }
  })
}
