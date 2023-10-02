import { sep, parse } from 'path'

export const getPathArray = (path: string): string[] => path.split(sep)

export const ensureOsFileSep = (path: string): string =>
  path.replace(/\\/g, '/').split('/').join(sep)

export const getPath = (pathArray: string[], idx: number) =>
  pathArray.slice(0, idx).join(sep)

export const getDirectChild = (pathArray: string[], idx: number) =>
  getPath(pathArray, idx + 1)

export const getParent = (pathArray: string[], idx: number) => {
  const parent = getPath(pathArray, idx - 1)
  if (!parent) {
    return undefined
  }
  return parent
}

export const removeTrailingSlash = (path: string): string =>
  path.endsWith(sep) ? path.slice(0, -1) : path

export const getFileName = (path: string) => parse(path).base

export const getFileNameWithoutExt = (path: string) => parse(path).name
