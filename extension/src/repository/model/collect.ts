import { join, relative, resolve } from 'path'
import { Uri } from 'vscode'
import { Resource } from '../commands'
import { addToMapSet } from '../../util/map'
import { DataStatusOutput } from '../../cli/reader'
import { relativeWithUri } from '../../fileSystem'
import { getDirectChild, getPath, getPathArray } from '../../fileSystem/util'
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

enum DataStatus {
  COMMITTED_ADDED = 'committedAdded',
  COMMITTED_DELETED = 'committedDeleted',
  COMMITTED_MODIFIED = 'committedModified',
  COMMITTED_RENAMED = 'committedRenamed',
  NOT_IN_CACHE = 'notInCache',
  UNCOMMITTED_ADDED = 'uncommittedAdded',
  UNCOMMITTED_DELETED = 'uncommittedDeleted',
  UNCOMMITTED_MODIFIED = 'uncommittedModified',
  UNCOMMITTED_RENAMED = 'uncommittedRenamed',
  UNCHANGED = 'unchanged',
  UNTRACKED = 'untracked'
}

type DataStatusAccumulator = { [path: string]: DataStatus }

const addMissingParents = (
  pathArray: string[],
  original: DataStatusAccumulator,
  withParents: DataStatusAccumulator
  // eslint-disable-next-line sonarjs/cognitive-complexity
): void => {
  const parents = new Set<string>()

  for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
    const path = getPath(pathArray, reverseIdx)

    const status = original[path] || withParents[path]
    if (status) {
      for (const parent of parents) {
        withParents[parent] = status
      }
      return
    }

    parents.add(path)
  }
}

const collectMissingParents = (originalMapping: {
  [path: string]: DataStatus
}): DataStatusAccumulator => {
  const withParents: DataStatusAccumulator = {}

  for (const [path, status] of Object.entries(originalMapping)) {
    withParents[path] = status
    const pathArray = getPathArray(path)
    addMissingParents(pathArray.slice(0, -1), originalMapping, withParents)
  }

  return withParents
}

const removeTrailingSlash = (path: string): string =>
  path.endsWith('/') ? path.slice(0, -1) : path

export const collectState = (
  dvcRoot: string,
  dataStatus: DataStatusOutput & { untracked?: string[] }
): Omit<DecorationState, 'tracked'> & {
  trackedDecorations: Set<string>
  untracked: Set<string>
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const acc: DataStatusAccumulator = {}

  for (const path of dataStatus.committed?.added || []) {
    acc[removeTrailingSlash(path)] = DataStatus.COMMITTED_ADDED
  }

  for (const path of dataStatus.committed?.deleted || []) {
    acc[removeTrailingSlash(path)] = DataStatus.COMMITTED_DELETED
  }

  for (const path of dataStatus.committed?.modified || []) {
    acc[removeTrailingSlash(path)] = DataStatus.COMMITTED_MODIFIED
  }

  for (const path of dataStatus.committed?.renamed || []) {
    acc[path.new] = DataStatus.COMMITTED_RENAMED
  }

  for (const path of dataStatus.uncommitted?.added || []) {
    acc[removeTrailingSlash(path)] = DataStatus.UNCOMMITTED_ADDED
  }

  for (const path of dataStatus.uncommitted?.deleted || []) {
    acc[removeTrailingSlash(path)] = DataStatus.UNCOMMITTED_DELETED
  }

  for (const path of dataStatus.uncommitted?.modified || []) {
    acc[removeTrailingSlash(path)] = DataStatus.UNCOMMITTED_MODIFIED
  }

  for (const path of dataStatus.uncommitted?.renamed || []) {
    acc[path.new] = DataStatus.UNCOMMITTED_RENAMED
  }

  for (const path of dataStatus.not_in_cache || []) {
    acc[removeTrailingSlash(path)] = DataStatus.NOT_IN_CACHE
  }

  for (const path of dataStatus.unchanged || []) {
    acc[removeTrailingSlash(path)] = DataStatus.UNCHANGED
  }

  for (const path of dataStatus.untracked || []) {
    acc[removeTrailingSlash(path)] = DataStatus.UNTRACKED
  }

  const patched = collectMissingParents(acc)

  const acc1 = {
    committedAdded: new Set<string>(),
    committedDeleted: new Set<string>(),
    committedModified: new Set<string>(),
    committedRenamed: new Set<string>(),
    notInCache: new Set<string>(),
    trackedDecorations: new Set<string>(),
    unchanged: new Set<string>(),
    uncommittedAdded: new Set<string>(),
    uncommittedDeleted: new Set<string>(),
    uncommittedModified: new Set<string>(),
    uncommittedRenamed: new Set<string>(),
    untracked: new Set<string>()
  }

  for (const [path, status] of Object.entries(patched)) {
    const absPath = getAbsPath(dvcRoot, path)
    acc1[status].add(absPath)

    if (status === DataStatus.UNTRACKED) {
      continue
    }

    acc1.trackedDecorations.add(absPath)
  }

  return acc1
}
