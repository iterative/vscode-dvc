export interface IExtension {
  canRunCli: (cwd: string) => Promise<boolean>
  hasRoots: () => boolean

  setRoots: () => Promise<void>
  initialize: () => Promise<void[]>
  reset: () => void
}
