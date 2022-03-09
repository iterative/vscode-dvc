import { dirname, join, resolve } from 'path'
import { Uri } from 'vscode'
import { Resource } from '../commands'
import { addToMapSet } from '../../util/map'
import { PathOutput } from '../../cli/reader'
import { isSameOrChild } from '../../fileSystem'
import { getDirectChild, getPath, getPathArray } from '../../fileSystem/util'

export type PathItem = Resource & {
  isDirectory: boolean
  isTracked: boolean
}

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
    const pathArray = getPathArray(path)

    isTracked.add(path)
    const dir = dirname(path)
    if (dir !== '.') {
      isTracked.add(dir)
    }

    for (let idx = 0; idx < pathArray.length; idx++) {
      const path = getPath(pathArray, idx)
      addToMapSet(acc, path, getDirectChild(pathArray, idx))
    }
  })

  return transform(dvcRoot, acc, isTracked)
}

const collectMissingParents = (acc: string[], absPath: string) => {
  if (!acc.length) {
    return
  }

  const prevAbsPath = acc.slice(-1)[0]
  if (!isSameOrChild(prevAbsPath, absPath)) {
    return
  }

  let dir = dirname(absPath)
  while (dir !== prevAbsPath) {
    acc.push(dir)
    dir = dirname(dir)
  }
}

export const collectModifiedAgainstHead = (
  dvcRoot: string,
  modified: PathOutput[],
  tracked: Set<string>
): string[] =>
  modified.reduce((acc, { path }) => {
    const absPath = resolve(dvcRoot, path)
    if (!tracked.has(absPath)) {
      return acc
    }

    collectMissingParents(acc, absPath)
    acc.push(absPath)

    return acc
  }, [] as string[])

export const collectTracked = (
  dvcRoot: string,
  paths: string[] = []
): Set<string> => {
  const acc = new Set<string>()

  paths.forEach(path => {
    const pathArray = getPathArray(path)

    for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
      const path = join(dvcRoot, getPath(pathArray, reverseIdx))
      if (acc.has(path)) {
        continue
      }

      acc.add(path)
    }
  })

  return acc
}
