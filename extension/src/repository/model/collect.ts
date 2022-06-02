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

const transformToAbsTree = (
  dvcRoot: string,
  acc: Map<string, Set<string>>,
  trackedRelPaths: Set<string>
): Map<string, PathItem[]> => {
  const absTree = new Map<string, PathItem[]>()

  for (const [path, childPaths] of acc.entries()) {
    const items = [...childPaths].map(childPath => ({
      dvcRoot,
      isDirectory: !!acc.get(childPath),
      isTracked: trackedRelPaths.has(childPath),
      resourceUri: Uri.file(join(dvcRoot, childPath))
    }))
    const absPath = Uri.file(join(dvcRoot, path)).fsPath
    absTree.set(absPath, items)
  }

  return absTree
}

export const collectTree = (
  dvcRoot: string,
  absLeafs: Set<string>,
  trackedRelPaths = new Set<string>()
): Map<string, PathItem[]> => {
  const relTree = new Map<string, Set<string>>()

  for (const absLeaf of absLeafs) {
    const relPath = relative(dvcRoot, absLeaf)
    const relPathArray = getPathArray(relPath)

    trackedRelPaths.add(relPath)

    for (let idx = 0; idx < relPathArray.length; idx++) {
      const path = getPath(relPathArray, idx)
      addToMapSet(relTree, path, getDirectChild(relPathArray, idx))
    }
  }

  return transformToAbsTree(dvcRoot, relTree, trackedRelPaths)
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

const collectAbsPath = (
  acc: Set<string>,
  absLeafs: Set<string>,
  dvcRoot: string,
  absPath: string
) => {
  const relPathArray = getPathArray(relative(dvcRoot, absPath))

  for (let reverseIdx = relPathArray.length; reverseIdx > 0; reverseIdx--) {
    const absPath = join(dvcRoot, getPath(relPathArray, reverseIdx))
    if (acc.has(absPath) || absLeafs.has(absPath)) {
      continue
    }

    acc.add(absPath)
  }
}

export const collectTrackedNonLeafs = (
  dvcRoot: string,
  absLeafs = new Set<string>()
): Set<string> => {
  const acc = new Set<string>()

  for (const absPath of absLeafs) {
    collectAbsPath(acc, absLeafs, dvcRoot, absPath)
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
  pathItem: string | PathItem,
  getChildren: (path: string) => Promise<PathItem[]>
): Promise<string[]> => {
  const acc: string[] = []
  if (typeof pathItem === 'string') {
    return acc
  }

  const { dvcRoot, resourceUri, isTracked } = pathItem
  if (isTracked !== false) {
    acc.push(relativeWithUri(dvcRoot, resourceUri))
    return acc
  }
  const children = await getChildren(resourceUri.fsPath)
  for (const child of children) {
    acc.push(...(await collectTrackedPaths(child, getChildren)))
  }
  return acc
}

type SelectedPathAccumulator = { [dvcRoot: string]: (string | PathItem)[] }

const collectSelectedPaths = (pathItems: (string | PathItem)[]): string[] => {
  const acc = new Set<string>()
  for (const pathItem of pathItems) {
    if (typeof pathItem === 'string') {
      acc.add(pathItem)
      continue
    }
    acc.add(pathItem.resourceUri.fsPath)
  }
  return [...acc]
}

const parentIsSelected = (fsPath: string, paths: string[]) => {
  for (const path of paths.filter(path => path !== fsPath)) {
    if (fsPath.includes(path)) {
      return true
    }
  }
  return false
}

const initializeAccumulatorRoot = (
  acc: SelectedPathAccumulator,
  dvcRoot: string
) => {
  if (!acc[dvcRoot]) {
    acc[dvcRoot] = []
  }
}

const collectPathItem = (
  acc: SelectedPathAccumulator,
  addedPaths: Set<string>,
  pathItem: PathItem | string,
  dvcRoot: string,
  path: string
) => {
  initializeAccumulatorRoot(acc, dvcRoot)
  acc[dvcRoot].push(pathItem)
  addedPaths.add(path)
}

const collectRoot = (
  acc: SelectedPathAccumulator,
  addedPaths: Set<string>,
  path: string
) => collectPathItem(acc, addedPaths, path, path, path)

const collectRootOrPathItem = (
  acc: SelectedPathAccumulator,
  addedPaths: Set<string>,
  paths: string[],
  pathItem: string | PathItem
) => {
  const path =
    typeof pathItem === 'string' ? pathItem : pathItem.resourceUri.fsPath
  if (addedPaths.has(path) || parentIsSelected(path, paths)) {
    return
  }

  if (typeof pathItem === 'string') {
    collectRoot(acc, addedPaths, path)
    return
  }

  const { dvcRoot } = pathItem
  collectPathItem(acc, addedPaths, pathItem, dvcRoot, path)
}

export const collectSelected = (
  pathItems: (string | PathItem)[]
): SelectedPathAccumulator => {
  const selectedPaths = collectSelectedPaths(pathItems)
  const acc: SelectedPathAccumulator = {}
  const addedPaths = new Set<string>()
  for (const pathItem of pathItems) {
    collectRootOrPathItem(acc, addedPaths, selectedPaths, pathItem)
  }
  return acc
}

const isUncollectedChild = (
  deleted: Set<string>,
  deletedPath: string,
  trackedPath: string
): boolean => {
  return !deleted.has(trackedPath) && isSameOrChild(deletedPath, trackedPath)
}

const collectIfDeletedChild = (
  deleted: Set<string>,
  deletedPath: string,
  trackedPath: string
): void => {
  if (isUncollectedChild(deleted, deletedPath, trackedPath)) {
    deleted.add(trackedPath)
  }
}

export const collectDeleted = (
  deleted: Set<string>,
  tracked: Set<string>
): Set<string> => {
  for (const trackedPath of tracked) {
    for (const deletedPath of deleted) {
      collectIfDeletedChild(deleted, deletedPath, trackedPath)
    }
  }
  return deleted
}
