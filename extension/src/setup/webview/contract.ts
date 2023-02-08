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
