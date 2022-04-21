export interface IExtension {
  canRunCli: (cwd: string) => Promise<boolean>
  hasRoots: () => boolean

  setupWorkspace: () => void

  initialize: () => Promise<void[]>
  resetMembers: () => void
  setAvailable: (available: boolean) => void
  setRoots: () => Promise<void>
}
