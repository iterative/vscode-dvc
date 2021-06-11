export interface IExtension {
  hasWorkspaceFolder: () => boolean
  hasRoots: () => boolean
  canRunCli: () => Promise<boolean>

  initialize: () => void
  initializePreCheck: () => Promise<void>
  reset: () => void
}
