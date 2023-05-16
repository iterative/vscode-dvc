export type DvcCliDetails = {
  command: string
  version: string | undefined
}

export type RemoteList = { [alias: string]: string } | undefined

export type SetupData = {
  canGitInitialize: boolean
  cliCompatible: boolean | undefined
  dvcCliDetails: DvcCliDetails | undefined
  hasData: boolean | undefined
  isPythonExtensionUsed: boolean
  isStudioConnected: boolean
  needsGitCommit: boolean
  needsGitInitialized: boolean | undefined
  projectInitialized: boolean
  pythonBinPath: string | undefined
  remoteList: RemoteList
  sectionCollapsed: typeof DEFAULT_SECTION_COLLAPSED | undefined
  shareLiveToStudio: boolean
}

export enum SetupSection {
  DVC = 'dvc',
  EXPERIMENTS = 'experiments',
  REMOTE = 'remote',
  STUDIO = 'studio'
}

export const DEFAULT_SECTION_COLLAPSED = {
  [SetupSection.DVC]: false,
  [SetupSection.EXPERIMENTS]: false,
  [SetupSection.REMOTE]: false,
  [SetupSection.STUDIO]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED

export const STUDIO_URL = 'https://studio.iterative.ai'
