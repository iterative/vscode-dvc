import { dirname, join, relative, resolve } from 'path'
import { Uri } from 'vscode'
import { Resource } from '../commands'
import { addToMapSet } from '../../util/map'
import { ExperimentsOutput, PathOutput } from '../../cli/reader'
import { isSameOrChild, relativeWithUri } from '../../fileSystem'
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

  for (const [path, childPaths] of acc.entries()) {
    const items = [...childPaths].map(childPath => ({
      dvcRoot,
      isDirectory: !!acc.get(childPath),
      isTracked: isTracked.has(childPath),
      resourceUri: Uri.file(join(dvcRoot, childPath))
    }))
    const absPath = Uri.file(join(dvcRoot, path)).fsPath
    treeMap.set(absPath, items)
  }

  return treeMap
}

export const collectTree = (
  dvcRoot: string,
  leafs: Set<string>,
  isTracked = new Set<string>() // rel
): Map<string, PathItem[]> => {
  const acc = new Map<string, Set<string>>()

  for (const leaf of leafs) {
    const path = relative(dvcRoot, leaf) // rel
    const pathArray = getPathArray(path)

    isTracked.add(path)

    for (let idx = 0; idx < pathArray.length; idx++) {
      const path = getPath(pathArray, idx)
      addToMapSet(acc, path, getDirectChild(pathArray, idx))
    }
  }

  return transform(dvcRoot, acc, isTracked)
}

const collectMissingParents = (acc: string[], absPath: string) => {
  if (acc.length === 0) {
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
): string[] => {
  const acc: string[] = []

  for (const { path } of modified) {
    const absPath = resolve(dvcRoot, path)
    if (!tracked.has(absPath)) {
      continue
    }

    collectMissingParents(acc, absPath)
    acc.push(absPath)
  }

  return acc
}

const collectPath = (
  acc: Set<string>,
  leafs: Set<string>,
  dvcRoot: string,
  path: string
) => {
  const pathArray = getPathArray(relative(dvcRoot, path))

  for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
    const path = join(dvcRoot, getPath(pathArray, reverseIdx))
    if (acc.has(path) || leafs.has(path)) {
      continue
    }

    acc.add(path)
  }
}

export const collectTrackedNonLeafs = (
  dvcRoot: string,
  leafs = new Set<string>()
): Set<string> => {
  const acc = new Set<string>()

  for (const path of leafs) {
    collectPath(acc, leafs, dvcRoot, path)
  }

  return acc
}

export const collectTrackedOuts = (data: ExperimentsOutput): Set<string> => {
  const acc = new Set<string>()
  for (const [relPath, { use_cache }] of Object.entries(
    data.workspace.baseline.data?.outs || {}
  )) {
    if (use_cache) {
      acc.add(relPath)
    }
  }
  return acc
}

export const collectTrackedPaths = async (
  { dvcRoot, resourceUri, isTracked }: PathItem,
  getChildren: (path: string) => Promise<PathItem[]>
): Promise<string[]> => {
  const acc = []

  if (isTracked) {
    acc.push(relativeWithUri(dvcRoot, resourceUri))
    return acc
  }
  const children = await getChildren(resourceUri.fsPath)
  for (const child of children) {
    acc.push(...(await collectTrackedPaths(child, getChildren)))
  }
  return acc
}
