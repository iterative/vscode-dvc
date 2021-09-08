export interface IExtension {
  hasWorkspaceFolder: () => boolean
  hasRoots: () => boolean
  canRunCli: () => Promise<boolean>

  initialize: () => Promise<void[]>
  initializePreCheck: () => Promise<void>
  reset: () => void
}
