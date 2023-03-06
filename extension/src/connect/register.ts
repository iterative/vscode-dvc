import { Connect } from '.'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'

export const registerConnectCommands = (
  connect: Connect,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.CONNECT_SHOW,
    () => connect.showWebview()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.OPEN_STUDIO_SETTINGS,
    () => connect.showWebview()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.ADD_STUDIO_ACCESS_TOKEN,
    () => connect.saveStudioAccessToken()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.UPDATE_STUDIO_ACCESS_TOKEN,
    () => connect.saveStudioAccessToken()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.REMOVE_STUDIO_ACCESS_TOKEN,
    () => connect.removeStudioAccessToken()
  )
}
