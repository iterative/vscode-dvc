import { Disposable } from '@hediet/std/disposable'
import chokidar from 'chokidar'
import debounce from 'lodash.debounce'
import { dirname, join, resolve, basename } from 'path'
import glob from 'tiny-glob'
import { getRoot, listDvcOnlyRecursive } from './cli'
import { Config } from './Config'

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
  config: Config,
  cwd: string
): Promise<string | undefined> => {
  try {
    const root = await getRoot(config, cwd)
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
  config: Config,
  cwd: string
): Promise<string[]> => {
  const [subRoots, absoluteRoot] = await Promise.all([
    findDvcSubRootPaths(cwd),
    findDvcAbsoluteRootPath(config, cwd)
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
  config: Config
): Promise<Set<string>> => {
  const cwd = config.workspaceRoot
  const [dotDvcFiles, dvcListFiles] = await Promise.all([
    glob(join('**', '*.dvc'), {
      absolute: true,
      cwd,
      dot: true,
      filesOnly: true
    }),

    listDvcOnlyRecursive(config)
  ])

  return new Set([
    ...getAbsoluteTrackedPath(dotDvcFiles),
    ...getAbsolutePath(cwd, dvcListFiles),
    ...getAbsoluteParentPath(cwd, dvcListFiles)
  ])
}
