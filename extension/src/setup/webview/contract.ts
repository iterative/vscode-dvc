export type SetupData = {
  canGitInitialize: boolean
  cliCompatible: boolean | undefined
  projectInitialized: boolean
  hasData: boolean | undefined
  isPythonExtensionInstalled: boolean
  needsGitInitialized: boolean | undefined
  pythonBinPath: string | undefined
}
