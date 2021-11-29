import { join, relative, resolve } from 'path'
import { existsSync, lstatSync, readdir } from 'fs-extra'
import { Uri } from 'vscode'
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

export const relativeWithUri = (dvcRoot: string, uri: Uri) =>
  relative(dvcRoot, uri.fsPath)
