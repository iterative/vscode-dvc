import { basename, extname, join, relative, resolve } from 'path'
import {
  existsSync,
  lstatSync,
  readdir,
  readFileSync,
  removeSync,
  writeFileSync
} from 'fs-extra'
import { load } from 'js-yaml'
import { Uri } from 'vscode'
import { definedAndNonEmpty } from '../util/array'
import { Logger } from '../common/logger'

export const exists = (path: string): boolean => existsSync(path)

export const isDirectory = (path: string): boolean => {
  try {
    return lstatSync(path).isDirectory()
  } catch {
    return false
  }
}

export const getModifiedTime = (path: string): number =>
  lstatSync(path).mtime.getTime()

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

export const findDvcRootPaths = async (cwd: string): Promise<string[]> => {
  const subRoots = await findDvcSubRootPaths(cwd)

  if (definedAndNonEmpty(subRoots)) {
    return subRoots
  }
  return []
}

export const findAbsoluteDvcRootPath = async (
  cwd: string,
  relativePathPromise: Promise<string | undefined>
): Promise<string[]> => {
  const relativePath = await relativePathPromise
  if (!relativePath) {
    return []
  }

  const absoluteRoot = resolve(cwd, relativePath)

  return [absoluteRoot]
}

export const isSameOrChild = (root: string, path: string) => {
  const rel = relative(root, path)
  return !rel.startsWith('..')
}

export type PartialDvcYaml = {
  stages: {
    train: { outs: (string | Record<string, { checkpoint?: boolean }>)[] }
  }
}

export const isAnyDvcYaml = (path?: string): boolean =>
  !!(
    path &&
    (extname(path) === '.dvc' ||
      basename(path) === 'dvc.lock' ||
      basename(path) === 'dvc.yaml')
  )

export const relativeWithUri = (dvcRoot: string, uri: Uri) =>
  relative(dvcRoot, uri.fsPath)

export const removeDir = (path: string): void => removeSync(path)

export const loadYaml = <T>(path: string): T | undefined => {
  try {
    return load(readFileSync(path, 'utf8')) as T
  } catch {
    Logger.error(`failed to load yaml ${path}`)
  }
}

export const loadJson = <T>(path: string): T | undefined => {
  try {
    return JSON.parse(readFileSync(path).toString()) as T
  } catch {
    Logger.error(`failed to load JSON from ${path}`)
  }
}

export const writeJson = <T extends Record<string, unknown>>(
  path: string,
  obj: T
): void => writeFileSync(path, JSON.stringify(obj))
