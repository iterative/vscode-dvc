export type SetupData = {
  canGitInitialize: boolean
  cliCompatible: boolean | undefined
  hasData: boolean | undefined
  isPythonExtensionInstalled: boolean
  needsGitInitialized: boolean | undefined
  needsGitCommit: boolean
  projectInitialized: boolean
  pythonBinPath: string | undefined
}

export enum Section {
  EXPERIMENTS = 'experiments'
}

export const DEFAULT_SECTION_COLLAPSED = {
  [Section.EXPERIMENTS]: false
}

export type SectionCollapsed = typeof DEFAULT_SECTION_COLLAPSED
