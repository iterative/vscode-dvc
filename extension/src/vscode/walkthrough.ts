import { commands, Memento } from 'vscode'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'
import { PersistenceKey } from '../persistence/constants'
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

export const showWalkthroughOnFirstUse = (
  globalState: Memento,
  isNewAppInstall: boolean
) => {
  if (
    isNewAppInstall &&
    !globalState.get(PersistenceKey.WALKTHROUGH_SHOWN_AFTER_INSTALL)
  ) {
    commands.executeCommand(RegisteredCommands.EXTENSION_GET_STARTED)
    globalState.update(PersistenceKey.WALKTHROUGH_SHOWN_AFTER_INSTALL, true)
  }

  if (!isNewAppInstall) {
    globalState.update(
      PersistenceKey.WALKTHROUGH_SHOWN_AFTER_INSTALL,
      undefined
    )
  }
}
