import { window } from 'vscode'
import { IExtension } from './interfaces'

export const setup = async (extension: IExtension) => {
  const hasWorkspaceFolder = extension.hasWorkspaceFolder()
  if (!hasWorkspaceFolder) {
    return
  }

  await extension.initializePreCheck()

  if (await extension.canRunCli()) {
    return extension.initialize()
  }

  extension.reset()

  window.showInformationMessage(
    'DVC extension is unable to initialize as the cli is not available.\n' +
      'Update your config options to try again.'
  )
}
