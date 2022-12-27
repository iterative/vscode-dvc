export interface IExtension {
  getCliVersion: (
    cwd: string,
    isCliGlobal?: true
  ) => Promise<string | undefined>
  getRoots: () => string[]
  hasRoots: () => boolean
  isPythonExtensionUsed: () => Promise<boolean>

  showSetup: () => void
  shouldWarnUserIfCLIUnavailable: () => boolean

  initialize: () => Promise<void[]>
  resetMembers: () => void

  setAvailable: (available: boolean) => void
  getAvailable: () => boolean
  setCliCompatible: (compatible: boolean | undefined) => void
  setRoots: () => Promise<void>
  unsetPythonBinPath: () => void
}
