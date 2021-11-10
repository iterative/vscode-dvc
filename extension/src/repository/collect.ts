import { join, sep } from 'path'
import { Uri } from 'vscode'
import { addToMapSet } from '../util/map'

const getPath = (pathArray: string[], idx: number) =>
  pathArray.slice(0, idx).join(sep)

const getDirectChild = (pathArray: string[], idx: number) =>
  getPath(pathArray, idx + 1)

const transform = (
  dvcRoot: string,
  acc: Map<string, Set<string>>
): Map<string, Uri[]> => {
  const treeMap = new Map<string, Uri[]>()

  acc.forEach((paths, path) => {
    const uris = [...paths].map(path => Uri.file(join(dvcRoot, path)))
    const absPath = join(dvcRoot, path)
    treeMap.set(absPath, uris)
  })

  return treeMap
}

export const collectTree = (
  dvcRoot: string,
  paths: string[]
): Map<string, Uri[]> => {
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
