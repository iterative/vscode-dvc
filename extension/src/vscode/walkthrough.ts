import { commands, Memento } from 'vscode'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'

export const registerWalkthroughCommands = (
  internalCommands: InternalCommands
) =>
  internalCommands.registerExternalCommand(
    RegisteredCommands.EXTENSION_GET_STARTED,
    () =>
      commands.executeCommand(
        'workbench.action.openWalkthrough',
        'iterative.dvc#welcome'
      )
  )

export const MementoKey = 'walkthroughShownAfterInstall'

export const showWalkthroughOnFirstUse = (globalState: Memento) => {
  if (!globalState.get(MementoKey)) {
    commands.executeCommand(RegisteredCommands.EXTENSION_GET_STARTED)
    globalState.update(MementoKey, true)
  }
}
