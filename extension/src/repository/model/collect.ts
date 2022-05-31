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
