import { commands } from 'vscode'
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
