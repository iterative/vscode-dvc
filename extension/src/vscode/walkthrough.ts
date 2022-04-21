import { commands } from 'vscode'
import { ConfigKey, getConfigValue, setUserConfigValue } from './config'
import { Response } from './response'
import { Toast } from './toast'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'
import { joinTruthyItems } from '../util/array'

export const registerWalkthroughCommands = (
  internalCommands: InternalCommands,
  extensionId: string,
  walkthroughId: string
) => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.EXTENSION_GET_STARTED,
    () =>
      commands.executeCommand(
        'workbench.action.openWalkthrough',
        joinTruthyItems([extensionId, walkthroughId], '#')
      )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.EXTENSION_SHOW_COMMANDS,
    () => commands.executeCommand('workbench.action.quickOpen', '> DVC')
  )
}

export const showWalkthroughOnFirstUse = async (
  isNewAppInstall: boolean
): Promise<void> => {
  if (
    !isNewAppInstall ||
    getConfigValue<boolean>(ConfigKey.DO_NOT_SHOW_WALKTHROUGH_AFTER_INSTALL)
  ) {
    return
  }

  const response = await Toast.askShowOrCloseOrNever(
    'Need help? There is a walkthrough.'
  )

  if (response === Response.SHOW) {
    commands.executeCommand(RegisteredCommands.EXTENSION_GET_STARTED)
  }
  if (response === Response.NEVER) {
    setUserConfigValue(ConfigKey.DO_NOT_SHOW_WALKTHROUGH_AFTER_INSTALL, true)
  }
}
