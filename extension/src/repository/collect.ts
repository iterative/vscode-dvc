import { join, sep } from 'path'
import { Uri } from 'vscode'
import { Resource } from './commands'
import { addToMapSet } from '../util/map'

export type PathItem = Resource & {
  isDirectory: boolean
}

const getPath = (pathArray: string[], idx: number) =>
  pathArray.slice(0, idx).join(sep)

const getDirectChild = (pathArray: string[], idx: number) =>
  getPath(pathArray, idx + 1)

const transform = (
  dvcRoot: string,
  acc: Map<string, Set<string>>
): Map<string, PathItem[]> => {
  const treeMap = new Map<string, PathItem[]>()

  acc.forEach((paths, path) => {
    const items = [...paths].map(path => ({
      dvcRoot,
      isDirectory: !!acc.get(path),
      resourceUri: Uri.file(join(dvcRoot, path))
    }))
    const absPath = Uri.file(join(dvcRoot, path)).fsPath
    treeMap.set(absPath, items)
  })

  return treeMap
}

export const collectTree = (
  dvcRoot: string,
  paths: string[]
): Map<string, PathItem[]> => {
  const acc = new Map<string, Set<string>>()

  paths.forEach(path => {
    const pathArray = path.split(sep)

    pathArray.reduce((acc, _, i) => {
      const path = getPath(pathArray, i)
      addToMapSet(acc, path, getDirectChild(pathArray, i))
      return acc
    }, acc)
  })

  return transform(dvcRoot, acc)
}
