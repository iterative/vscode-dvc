import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import { lstatSync } from 'fs'
import { readdir } from 'fs-extra'
import { dirname, join, resolve, basename } from 'path'
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

const filterRootDir = (dirs: string[], rootDir: string) =>
  dirs.filter(dir => dir !== rootDir)

const findDvcAbsoluteRootPath = async (
  cwd: string,
  cliPath: string | undefined
): Promise<string | undefined> => {
  try {
    const root = await getRoot({
      cliPath,
      cwd
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
  const children = await readdir(cwd)
  if (children.filter(child => child === '.dvc').length) {
    return [cwd]
  }

  return children
    .filter(child => isDirectory(join(cwd, child, '.dvc')))
    .map(child => join(cwd, child))
}

export const findDvcRootPaths = async (
  cwd: string,
  cliPath: string | undefined
): Promise<string[]> => {
  const subRoots = await findDvcSubRootPaths(cwd)

  if (subRoots?.length) {
    return subRoots
  }

  const absoluteRoot = await findDvcAbsoluteRootPath(cwd, cliPath)

  const roots = [absoluteRoot].filter(v => v).sort() as string[]

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
  cliPath: string | undefined
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
