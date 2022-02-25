import { dirname, join, sep } from 'path'
import { Uri } from 'vscode'
import { Resource } from '../commands'
import { addToMapSet } from '../../util/map'

export type PathItem = Resource & {
  isDirectory: boolean
  isTracked: boolean
}

const getPath = (pathArray: string[], idx: number) =>
  pathArray.slice(0, idx).join(sep)

const getDirectChild = (pathArray: string[], idx: number) =>
  getPath(pathArray, idx + 1)

const transform = (
  dvcRoot: string,
  acc: Map<string, Set<string>>,
  isTracked: Set<string>
): Map<string, PathItem[]> => {
  const treeMap = new Map<string, PathItem[]>()

  acc.forEach((paths, path) => {
    const items = [...paths].map(path => ({
      dvcRoot,
      isDirectory: !!acc.get(path),
      isTracked: isTracked.has(path),
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
  const isTracked = new Set<string>()

  paths.forEach(path => {
    const pathArray = path.split(sep)

    isTracked.add(path)
    const dir = dirname(path)
    if (dir !== '.') {
      isTracked.add(dir)
    }

    pathArray.reduce((acc, _, i) => {
      const path = getPath(pathArray, i)
      addToMapSet(acc, path, getDirectChild(pathArray, i))
      return acc
    }, acc)
  })

  return transform(dvcRoot, acc, isTracked)
}

export const collectTracked = (
  dvcRoot: string,
  paths: string[] = []
): Set<string> =>
  paths.reduce((acc, path) => {
    acc.add(join(dvcRoot, path))

    const dir = dirname(path)
    if (acc.has(join(dvcRoot, dir))) {
      return acc
    }

    const pathArray = dir.split(sep)
    path.split(sep).reduce((acc, _, i) => {
      const path = getPath(pathArray, i)
      if (path) {
        acc.add(join(dvcRoot, path))
      }
      return acc
    }, acc)
    return acc
  }, new Set<string>())
