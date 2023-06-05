/* eslint-disable import/no-unused-modules */
import { Memento, commands } from 'vscode'
import { RegisteredCommands } from '../commands/external'
import { ConfigKey, getConfigValue, setUserConfigValue } from '../vscode/config'
import { Response } from '../vscode/response'
import { Toast } from '../vscode/toast'
import { GlobalPersistenceKey } from '../persistence/constants'

const showSetupToast = async (isNewAppInstall: boolean): Promise<void> => {
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
    void commands.executeCommand(RegisteredCommands.SETUP_SHOW)
  }
  if (response === Response.NEVER) {
    void setUserConfigValue(ConfigKey.DO_NOT_SHOW_SETUP_AFTER_INSTALL, true)
  }
}

export const showSetupOnFirstUse = (
  globalState: Memento,
  workspaceState: Memento
): Promise<void> | undefined => {
  const installed = globalState.get(GlobalPersistenceKey.INSTALLED, false)

  if (installed) {
    return
  }

  void globalState.update(GlobalPersistenceKey.INSTALLED, true)

  // old users won't have the installedKey even if it's not a new install
  const workspaceKeys = workspaceState.keys()
  return showSetupToast(workspaceKeys.length === 0)
}
