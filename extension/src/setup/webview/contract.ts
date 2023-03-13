export type SetupData = {
  canGitInitialize: boolean
  cliCompatible: boolean | undefined
  hasData: boolean | undefined
  isPythonExtensionInstalled: boolean
  isStudioConnected: boolean
  needsGitCommit: boolean
  needsGitInitialized: boolean | undefined
  projectInitialized: boolean
  pythonBinPath: string | undefined
  shareLiveToStudio: boolean
}

export enum Section {
  EXPERIMENTS = 'experiments',
  STUDIO = 'studio'
}

export const DEFAULT_SECTION_COLLAPSED = {
  [Section.EXPERIMENTS]: false,
  [Section.STUDIO]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED

export const STUDIO_URL = 'https://studio.iterative.ai'
