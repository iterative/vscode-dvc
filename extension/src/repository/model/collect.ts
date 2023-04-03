import { join, relative, resolve } from 'path'
import { Uri } from 'vscode'
import { Resource } from '../commands'
import { addToMapSet } from '../../util/map'
import { Changes, DataStatusOutput } from '../../cli/dvc/contract'
import { DecorationDataStatus } from '../sourceControlManagement/decorationProvider'
import { relativeWithUri } from '../../fileSystem'
import {
  getDirectChild,
  getPath,
  getPathArray,
  removeTrailingSlash
} from '../../fileSystem/util'
import { DiscardedStatus, UndecoratedDataStatus } from '../constants'

const AvailableDataStatus = Object.assign(
  {} as const,
  DecorationDataStatus,
  UndecoratedDataStatus
)

const ExtendedDataStatus = Object.assign(
  {} as const,
  AvailableDataStatus,
  DiscardedStatus
)

export type ExtendedStatus =
  (typeof ExtendedDataStatus)[keyof typeof ExtendedDataStatus]

export type Status =
  (typeof AvailableDataStatus)[keyof typeof AvailableDataStatus]

type DataStatusMapping = { [path: string]: ExtendedStatus }

export type DataStatusAccumulator = Record<Status, Set<string>>

const getStatus = (
  path: string,
  original: DataStatusMapping,
  withMissingAncestors: DataStatusMapping
) => original[path] || withMissingAncestors[path]

const addMissingWithAncestorStatus = (
  withMissingAncestors: DataStatusMapping,
  missingAncestors: Set<string>,
  status: ExtendedStatus
): void => {
  for (const ancestor of missingAncestors) {
    withMissingAncestors[ancestor] = status
  }
}

const addMissingAncestors = (
  pathArray: string[],
  original: DataStatusMapping,
  withMissingAncestors: DataStatusMapping
): void => {
  const missingAncestors = new Set<string>()

  for (let reverseIdx = pathArray.length; reverseIdx > 0; reverseIdx--) {
    const path = getPath(pathArray, reverseIdx)

    const status = getStatus(path, original, withMissingAncestors)
    if (status) {
      addMissingWithAncestorStatus(
        withMissingAncestors,
        missingAncestors,
        status
      )
      return
    }

    missingAncestors.add(path)
  }
}

const collectMissingAncestors = (originalMapping: {
  [path: string]: ExtendedStatus
}): DataStatusMapping => {
  const withMissingAncestors: DataStatusMapping = {}

  for (const [path, status] of Object.entries(originalMapping)) {
    withMissingAncestors[path] = status
    const pathArray = getPathArray(path)
    addMissingAncestors(
      pathArray.slice(0, -1),
      originalMapping,
      withMissingAncestors
    )
  }

  return withMissingAncestors
}

const addToTracked = (
  tracked: Set<string>,
  absPath: string,
  status: ExtendedStatus
) => {
  if (status === ExtendedDataStatus.UNTRACKED) {
    return
  }

  tracked.add(absPath)
}

const mapChangesToGroup = (
  type: 'COMMITTED' | 'UNCOMMITTED',
  changes: Changes | undefined
): Partial<Record<ExtendedStatus, string[] | undefined>> => ({
  [ExtendedDataStatus[`${type}_ADDED`]]: changes?.added,
  [ExtendedDataStatus[`${type}_DELETED`]]: changes?.deleted,
  [ExtendedDataStatus[`${type}_MODIFIED`]]: changes?.modified,
  [ExtendedDataStatus[`${type}_RENAMED`]]: changes?.renamed?.map(
    ({ new: path }) => path
  ),
  [ExtendedDataStatus[`${type}_UNKNOWN`]]: changes?.unknown
})

const mapGroupedStatuses = (
  dataStatusOutput: DataStatusOutput
): Partial<Record<ExtendedStatus, string[] | undefined>>[] => [
  mapChangesToGroup('COMMITTED', dataStatusOutput.committed),
  mapChangesToGroup('UNCOMMITTED', dataStatusOutput.uncommitted)
]

const mapUngroupedStatuses = (
  dataStatusOutput: DataStatusOutput & { untracked?: string[] }
): { key: ExtendedStatus; paths: string[] | undefined }[] => [
  {
    key: ExtendedDataStatus.NOT_IN_CACHE,
    paths: dataStatusOutput.not_in_cache
  },
  {
    key: ExtendedDataStatus.UNTRACKED,
    paths: dataStatusOutput.untracked
  },
  {
    key: ExtendedDataStatus.UNCHANGED,
    paths: dataStatusOutput.unchanged
  }
]

const collectSingleStatus = (
  acc: { tracked: Set<string> },
  dataStatusMapping: DataStatusMapping,
  dvcRoot: string,
  status: ExtendedStatus,
  paths: string[] | undefined
): DataStatusMapping => {
  for (const path of paths || []) {
    dataStatusMapping[removeTrailingSlash(path)] = status
    addToTracked(acc.tracked, resolve(dvcRoot, path), status)
  }
  return dataStatusMapping
}

const collectMappingFromGroup = (
  acc: { tracked: Set<string> },
  dvcRoot: string,
  dataStatus: Partial<Record<ExtendedStatus, string[] | undefined>>
): DataStatusMapping => {
  const dataStatusMapping: DataStatusMapping = {}

  for (const [key, data] of Object.entries(dataStatus)) {
    collectSingleStatus(
      acc,
      dataStatusMapping,
      dvcRoot,
      key as ExtendedStatus,
      data
    )
  }

  return dataStatusMapping
}

export const createDataStatusAccumulator = (): DataStatusAccumulator => {
  const acc = {} as DataStatusAccumulator
  for (const status of Object.values(AvailableDataStatus)) {
    acc[status] = new Set<string>()
  }
  return acc
}

const uncommitNotInCache = (
  acc: DataStatusAccumulator,
  absPath: string,
  status: ExtendedStatus
): ExtendedStatus => {
  if (!status.startsWith('committed') || !acc.notInCache.has(absPath)) {
    return status
  }
  return ('un' + status) as ExtendedStatus
}

const collectGroupWithMissingAncestors = (
  acc: DataStatusAccumulator,
  dvcRoot: string,
  dataStatusMapping: DataStatusMapping
) => {
  const groupWithMissingAncestors = collectMissingAncestors(dataStatusMapping)

  for (const [path, originalStatus] of Object.entries(
    groupWithMissingAncestors
  )) {
    const absPath = resolve(dvcRoot, path)
    const status = uncommitNotInCache(acc, absPath, originalStatus)

    if (status !== DiscardedStatus.UNCHANGED) {
      acc[status].add(absPath)
    }

    addToTracked(acc.trackedDecorations, absPath, originalStatus)
  }
}

export const collectDataStatus = (
  dvcRoot: string,
  dataStatusOutput: DataStatusOutput & { untracked?: string[] }
): DataStatusAccumulator => {
  const acc = createDataStatusAccumulator()

  for (const { key, paths } of mapUngroupedStatuses(dataStatusOutput)) {
    const dataStatusMapping = collectSingleStatus(acc, {}, dvcRoot, key, paths)
    collectGroupWithMissingAncestors(acc, dvcRoot, dataStatusMapping)
  }

  for (const groupedStatuses of mapGroupedStatuses(dataStatusOutput)) {
    const dataStatusMapping = collectMappingFromGroup(
      acc,
      dvcRoot,
      groupedStatuses
    )
    collectGroupWithMissingAncestors(acc, dvcRoot, dataStatusMapping)
  }

  return acc
}

export type PathItem = Resource & {
  isDirectory: boolean
  isTracked: boolean
  error?: string
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
