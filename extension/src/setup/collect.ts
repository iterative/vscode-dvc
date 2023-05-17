import {
  DEFAULT_SECTION_COLLAPSED,
  RemoteList,
  SetupSection
} from './webview/contract'
import { trimAndSplit } from '../util/stdout'

export const collectSectionCollapsed = (
  focusedSection?: SetupSection
): typeof DEFAULT_SECTION_COLLAPSED | undefined => {
  if (!focusedSection) {
    return undefined
  }

  const acc = { ...DEFAULT_SECTION_COLLAPSED }
  for (const section of Object.keys(acc)) {
    if (section !== focusedSection) {
      acc[section as SetupSection] = true
    }
  }

  return acc
}

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
    const dvcRootRemotes: { [alias: string]: string } = {}
    for (const remote of remotes) {
      const [alias, url] = remote.split(/\s+/)
      dvcRootRemotes[alias] = url
    }
    acc[dvcRoot] = dvcRootRemotes
  }

  return acc
}
