export interface IExtension {
  canRunCli: (cwd: string, isCliGlobal?: true) => Promise<boolean>
  hasRoots: () => boolean
  isPythonExtensionUsed: () => Promise<boolean>

  setupWorkspace: () => void

  initialize: () => Promise<void[]>
  resetMembers: () => void
  setAvailable: (available: boolean) => void
  setRoots: () => Promise<void>
}
