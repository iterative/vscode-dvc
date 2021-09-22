export interface IExtension {
  hasWorkspaceFolder: () => boolean
  canRunCli: () => Promise<boolean>
  hasRoots: () => boolean

  setRoots: () => Promise<void>
  initialize: () => Promise<void[]>
  reset: () => void
}
