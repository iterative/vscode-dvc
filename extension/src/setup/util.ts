import { commands } from 'vscode'
import { RegisteredCommands } from '../commands/external'
import { ConfigKey, getConfigValue, setUserConfigValue } from '../vscode/config'
import { Response } from '../vscode/response'
import { Toast } from '../vscode/toast'

export const showSetupOnFirstUse = async (
  isNewAppInstall: boolean
): Promise<void> => {
  if (
    !isNewAppInstall ||
    getConfigValue<boolean>(ConfigKey.DO_NOT_SHOW_SETUP_AFTER_INSTALL)
  ) {
    return
  }

  const response = await Toast.askShowOrCloseOrNever(
    'Need help? Go to our setup view.'
  )

  if (response === Response.SHOW) {
    void commands.executeCommand(RegisteredCommands.SETUP_SHOW_DVC)
  }
  if (response === Response.NEVER) {
    void setUserConfigValue(ConfigKey.DO_NOT_SHOW_SETUP_AFTER_INSTALL, true)
  }
}
