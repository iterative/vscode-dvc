import { join, relative, resolve } from 'path'
import { Uri } from 'vscode'
import { Resource } from '../commands'
import { addToMapSet } from '../../util/map'
import { DataStatusOutput } from '../../cli/reader'
import { relativeWithUri } from '../../fileSystem'
import {
  getDirectChild,
  getParent,
  getPath,
  getPathArray
} from '../../fileSystem/util'
import { DecorationState } from '../decorationProvider'

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
  tracked: Set<string>
): Map<string, PathItem[]> => {
  const relTree = new Map<string, Set<string>>()

  const trackedRelPaths = new Set<string>()

  for (const absLeaf of tracked) {
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
  invokedPathItem: PathItem,
  selectedPathItems: (string | PathItem)[]
): SelectedPathAccumulator => {
  const invokedPath = invokedPathItem.resourceUri.fsPath

  if (
    !selectedPathItems.some(pathItem => {
      if (typeof pathItem === 'string') {
        return pathItem === invokedPath
      }
      return pathItem.resourceUri.fsPath === invokedPath
    })
  ) {
    return { [invokedPathItem.dvcRoot]: [invokedPathItem] }
  }

  const selectedPaths = collectSelectedPaths(selectedPathItems)
  const acc: SelectedPathAccumulator = {}
  const addedPaths = new Set<string>()
  for (const pathItem of selectedPathItems) {
    collectRootOrPathItem(acc, addedPaths, selectedPaths, pathItem)
  }
  return acc
}

const getAbsPath = (dvcRoot: string, relPath: string): string =>
  resolve(dvcRoot, relPath)

export const collectTracked = (
  dvcRoot: string,
  dataStatus: DataStatusOutput
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Set<string> => {
  const { committed, not_in_cache, uncommitted, unchanged } = dataStatus

  const tracked = new Set<string>(
    [...(unchanged || []), ...(not_in_cache || [])].map(path =>
      getAbsPath(dvcRoot, path)
    )
  )

  for (const paths of [
    ...Object.values(committed || {}),
    ...Object.values(uncommitted || {})
  ]) {
    for (const path of paths) {
      typeof path === 'string'
        ? tracked.add(resolve(dvcRoot, path))
        : tracked.add(resolve(dvcRoot, path.new))
    }
  }

  return tracked
}

// when we have a modified directory and a subdirectory contains changes we need to project modified down

const getSet = (dvcRoot: string, relPaths?: string[]): Set<string> =>
  new Set((relPaths || []).map(relPath => getAbsPath(dvcRoot, relPath)))

export const collectDecorationState = (
  dvcRoot: string,
  dataStatus: DataStatusOutput
): Omit<DecorationState, 'tracked'> => {
  return {
    committedAdded: getSet(dvcRoot, dataStatus.committed?.added),
    committedDeleted: getSet(dvcRoot, dataStatus.committed?.deleted),
    committedModified: getSet(dvcRoot, dataStatus.committed?.modified),
    committedRenamed: getSet(
      dvcRoot,
      dataStatus.committed?.renamed?.map(relPath => relPath.new)
    ),
    notInCache: getSet(dvcRoot, dataStatus.not_in_cache),
    uncommittedAdded: getSet(dvcRoot, dataStatus.uncommitted?.added),
    uncommittedDeleted: getSet(dvcRoot, dataStatus.uncommitted?.deleted),
    uncommittedModified: getSet(dvcRoot, dataStatus.uncommitted?.modified),
    uncommittedRenamed: getSet(
      dvcRoot,
      dataStatus.uncommitted?.renamed?.map(relPath => relPath.new)
    )
  }
}

export const collectTrackedDecorations = (
  tracked: Set<string>
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Set<string> => {
  const acc = new Set<string>(tracked)
  for (const path of tracked) {
    const pathArray = getPathArray(path)
    const parent = getParent(pathArray, pathArray.length)
    if (!parent || tracked.has(parent)) {
      continue
    }
    const grandParent = getParent(pathArray, pathArray.length - 1)

    if (grandParent && tracked.has(grandParent)) {
      acc.add(parent)
    }
  }
  return acc
}
