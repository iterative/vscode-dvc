import {
  DEFAULT_SECTION_COLLAPSED,
  RemoteList,
  SetupSection
} from './webview/contract'
import { trimAndSplit } from '../util/stdout'
import { isSameOrChild } from '../fileSystem'

export const collectSectionCollapsed = (
  focusedSection?: SetupSection
): typeof DEFAULT_SECTION_COLLAPSED | undefined => {
  if (!focusedSection) {
    return undefined
  }

  const acc = { ...DEFAULT_SECTION_COLLAPSED }
  for (const section of Object.keys(acc)) {
    if ((section as SetupSection) !== focusedSection) {
      acc[section as SetupSection] = true
    }
  }

  return acc
}

export const extractRemoteDetails = (remote: string): string[] =>
  remote.split(/\s+/)

export const collectRemoteList = async (
  dvcRoots: string[],
  getRemoteList: (cwd: string) => Promise<string | undefined>
): Promise<NonNullable<RemoteList>> => {
  const acc: NonNullable<RemoteList> = {}

  for (const dvcRoot of dvcRoots) {
    const remoteList = await getRemoteList(dvcRoot)
    if (!remoteList) {
      acc[dvcRoot] = undefined
      continue
    }
    const remotes = trimAndSplit(remoteList)
    const dvcRootRemotes: { [name: string]: string } = {}
    for (const remote of remotes) {
      const [name, url] = extractRemoteDetails(remote)
      dvcRootRemotes[name] = url
    }
    acc[dvcRoot] = dvcRootRemotes
  }

  return acc
}

const collectRootSubProjects = (
  dvcRoot: string,
  dvcRoots: string[]
): string[] => {
  const dvcRootSubProjects = []
  for (const potentialSubProject of dvcRoots) {
    if (
      dvcRoot === potentialSubProject ||
      !isSameOrChild(dvcRoot, potentialSubProject)
    ) {
      continue
    }
    dvcRootSubProjects.push(potentialSubProject)
  }
  return dvcRootSubProjects
}

export const collectSubProjects = (
  dvcRoots: string[]
): { [dvcRoot: string]: string[] } => {
  const subProjects: { [dvcRoot: string]: string[] } = {}
  for (const dvcRoot of dvcRoots) {
    subProjects[dvcRoot] = collectRootSubProjects(dvcRoot, dvcRoots)
  }
  return subProjects
}
