import { window } from 'vscode'

export interface IExtension {
  hasWorkspaceFolder: () => boolean
  canRunCli: () => Promise<boolean>

  initialize: () => void
  initializePreCheck: () => Promise<void>
  reset: () => void
}

export const setup = async (extension: IExtension) => {
  await extension.initializePreCheck()

  if (await extension.canRunCli()) {
    return extension.initialize()
  }

  extension.reset()

  const hasWorkspaceFolder = extension.hasWorkspaceFolder()
  if (!hasWorkspaceFolder) {
    return
  }
  window.showInformationMessage(
    'DVC extension is unable to initialize as the cli is not available.\n' +
      'Update your config options to try again.'
  )
}
