export interface IExtension {
  hasWorkspaceFolder: () => boolean
  canRunCli: () => Promise<boolean>

  initialize: () => void
  initializePreCheck: () => Promise<void>
  reset: () => void
}
