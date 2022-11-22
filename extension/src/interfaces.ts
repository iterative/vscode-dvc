export interface IExtension {
  getCliVersion: (
    cwd: string,
    isCliGlobal?: true
  ) => Promise<string | undefined>
  getRoots: () => string[]
  hasRoots: () => boolean
  isPythonExtensionUsed: () => Promise<boolean>

  setupWorkspace: () => void

  initialize: () => Promise<void[]>
  resetMembers: () => void

  setAvailable: (available: boolean) => void
  setCliCompatible: (compatible: boolean | undefined) => void
  setRoots: () => Promise<void>
  unsetPythonBinPath: () => void
}
