export type DvcCliDetails = {
  exampleCommand: string
  version: string | undefined
}

export type SetupData = {
  canGitInitialize: boolean
  cliCompatible: boolean | undefined
  dvcCliDetails: DvcCliDetails
  hasData: boolean | undefined
  isPythonExtensionInstalled: boolean
  isStudioConnected: boolean
  needsGitCommit: boolean
  needsGitInitialized: boolean | undefined
  projectInitialized: boolean
  pythonBinPath: string | undefined
  sectionCollapsed: typeof DEFAULT_SECTION_COLLAPSED | undefined
  shareLiveToStudio: boolean
}

export enum SetupSection {
  EXPERIMENTS = 'experiments',
  STUDIO = 'studio',
  DVC = 'dvc'
}

export const DEFAULT_SECTION_COLLAPSED = {
  [SetupSection.EXPERIMENTS]: false,
  [SetupSection.STUDIO]: false,
  [SetupSection.DVC]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED

export const STUDIO_URL = 'https://studio.iterative.ai'
