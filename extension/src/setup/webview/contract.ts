export type DvcCliDetails = {
  command: string
  version: string | undefined
}

export type RemoteList =
  | { [dvcRoot: string]: { [alias: string]: string } | undefined }
  | undefined

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
  isAboveLatestTestedVersion: boolean | undefined
}

export enum SetupSection {
  GET_STARTED = 'get-started',
  DVC = 'dvc',
  EXPERIMENTS = 'experiments',
  REMOTES = 'remotes',
  STUDIO = 'studio'
}

export const DEFAULT_SECTION_COLLAPSED = {
  [SetupSection.GET_STARTED]: false,
  [SetupSection.DVC]: false,
  [SetupSection.EXPERIMENTS]: false,
  [SetupSection.REMOTES]: false,
  [SetupSection.STUDIO]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED

export const STUDIO_URL = 'https://studio.iterative.ai'
