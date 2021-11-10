import { join, sep } from 'path'
import { Uri } from 'vscode'
import { addToMapSet } from '../util/map'

export const collectTree = (
  dvcRoot: string,
  paths: string[]
): Map<string, Uri[]> => {
  const map = new Map<string, Set<string>>()

  paths.forEach(path => {
    const pathArray = path.split(sep)

    pathArray.reduce((map, _, i) => {
      const path = pathArray.slice(0, i).join(sep)
      addToMapSet(map, path, pathArray.slice(0, i + 1).join(sep))
      return map
    }, map)
  })

  const newMap = new Map<string, Uri[]>()

  map.forEach((paths, path) => {
    const uris = [...paths].map(path => Uri.file(join(dvcRoot, path)))
    const absPath = join(dvcRoot, path)
    newMap.set(absPath, uris)
  })

  return newMap
}
