import { basename, extname, join, relative, resolve } from 'path'
import {
  createReadStream,
  existsSync,
  lstatSync,
  readdir,
  removeSync
} from 'fs-extra'
import { Uri } from 'vscode'
import { parse, Parser } from 'csv-parse'
import { definedAndNonEmpty } from '../util/array'

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

export const isAnyDvcYaml = (path?: string): boolean =>
  !!(
    path &&
    (extname(path) === '.dvc' ||
      basename(path) === 'dvc.lock' ||
      basename(path) === 'dvc.yaml')
  )

export const relativeWithUri = (dvcRoot: string, uri: Uri) =>
  relative(dvcRoot, uri.fsPath)

export const readCsv = (path: string): Parser =>
  createReadStream(path).pipe(parse({ columns: true, delimiter: ',' }))

export const removeDir = (path: string): void => removeSync(path)
