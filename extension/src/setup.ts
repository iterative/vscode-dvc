import { window } from 'vscode'
import { IExtension } from './interfaces'
import { getConfigValue, setConfigValue } from './vscode/config'

export const setup = async (extension: IExtension) => {
  const hasWorkspaceFolder = extension.hasWorkspaceFolder()
  if (!hasWorkspaceFolder) {
    return
  }

  await extension.initializePreCheck()

  if (extension.hasRoots() && (await extension.canRunCli())) {
    return extension.initialize()
  }

  extension.reset()

  if (getConfigValue('dvc.noCLIUnavailableInfo')) {
    return
  }

  const response = await window.showInformationMessage(
    'The DVC extension cannot currently access the CLI.\n' +
      'Update your config to try again.',
    "Don't Show Again"
  )

  if (response) {
    return setConfigValue('dvc.noCLIUnavailableInfo', true)
  }
}
