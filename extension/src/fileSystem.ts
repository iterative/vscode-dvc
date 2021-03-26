import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import { accessSync } from 'fs-extra'
import debounce from 'lodash.debounce'
import { basename, dirname, join, resolve } from 'path'
import { execPromise } from './util'
import glob from 'tiny-glob'
import { getRoot, listDvcOnlyRecursive } from './cli/reader'

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

const filterRootDir = (dirs: string[], rootDir: string) =>
  dirs.filter(dir => dir !== rootDir)

const findDvcAbsoluteRootPath = async (
  cwd: string,
  cliPath: string
): Promise<string | undefined> => {
  try {
    const root = await getRoot({
      cliPath: cliPath,
      cwd
    })
    return resolve(cwd, root)
  } catch (e) {}
}

const findDvcSubRootPaths = async (cwd: string): Promise<string[]> => {
  const files = await glob(join('**', '.dvc'), {
    absolute: true,
    cwd,
    dot: true
  })

  return filterRootDir(
    files.map(file => dirname(file)),
    cwd
  )
}

export const findDvcRootPaths = async (
  cwd: string,
  cliPath: string
): Promise<string[]> => {
  const [subRoots, absoluteRoot] = await Promise.all([
    findDvcSubRootPaths(cwd),
    findDvcAbsoluteRootPath(cwd, cliPath)
  ])

  const roots = [...subRoots, absoluteRoot].filter(v => v).sort() as string[]

  return roots
}

export const getAbsoluteTrackedPath = (files: string[]): string[] =>
  files.map(file => resolve(dirname(file), basename(file, '.dvc')))

const getAbsolutePath = (rootDir: string, files: string[]): string[] =>
  files.map(file => join(rootDir, file))

const getAbsoluteParentPath = (rootDir: string, files: string[]): string[] => {
  return filterRootDir(
    files.map(file => join(rootDir, dirname(file))),
    rootDir
  )
}

export const findDvcTrackedPaths = async (
  cwd: string,
  cliPath: string
): Promise<Set<string>> => {
  const [dotDvcFiles, dvcListFiles] = await Promise.all([
    glob(join('**', '*.dvc'), {
      absolute: true,
      cwd,
      dot: true,
      filesOnly: true
    }),

    listDvcOnlyRecursive({ cwd, cliPath })
  ])

  return new Set([
    ...getAbsoluteTrackedPath(dotDvcFiles),
    ...getAbsolutePath(cwd, dvcListFiles),
    ...getAbsoluteParentPath(cwd, dvcListFiles)
  ])
}
