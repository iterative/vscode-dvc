export interface IExtension {
  hasWorkspaceFolder: () => boolean
  canRunCli: () => Promise<boolean>

  initialize: () => Promise<void[]>
  reset: () => void
}
