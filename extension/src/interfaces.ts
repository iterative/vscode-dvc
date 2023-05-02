import { SetupSection } from './setup/webview/contract'

export interface IExtensionSetup {
  getCliVersion: (
    cwd: string,
    isCliGlobal?: true
  ) => Promise<string | undefined>
  getRoots: () => string[]
  hasRoots: () => boolean
  isPythonExtensionUsed: () => Promise<boolean>

  showSetup: (focusedSection?: SetupSection) => void
  shouldWarnUserIfCLIUnavailable: () => boolean

  initialize: () => Promise<void[]>
  resetMembers: () => void

  setAvailable: (available: boolean) => void
  getAvailable: () => boolean
  setCliCompatibleAndVersion: (
    compatible: boolean | undefined,
    version: string | undefined
  ) => void
  setRoots: () => Promise<void>
  unsetPythonBinPath: () => void
}
