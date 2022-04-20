export interface IExtension {
  canRunCli: (cwd: string) => Promise<boolean>
  hasRoots: () => boolean

  setupWorkspace: () => void

  setRoots: () => Promise<void>
  initialize: () => Promise<void[]>
  reset: () => void
}
