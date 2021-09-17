import { commands, Uri } from 'vscode'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'

export const reRegisterVsCodeCommands = (
  internalCommands: InternalCommands
) => {
  const registerExternalCommand = (
    commandId: RegisteredCommands,
    builtInCommandId: string
  ) =>
    internalCommands.registerExternalCommand<string>(commandId, path =>
      commands.executeCommand(builtInCommandId, Uri.file(path))
    )

  internalCommands.registerExternalCommand<Uri>(
    RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
    resource => commands.executeCommand('vscode.open', resource)
  )

  registerExternalCommand(
    RegisteredCommands.TRACKED_EXPLORER_OPEN_TO_THE_SIDE,
    'explorer.openToSide'
  )

  registerExternalCommand(
    RegisteredCommands.TRACKED_EXPLORER_SELECT_FOR_COMPARE,
    'selectForCompare'
  )

  registerExternalCommand(
    RegisteredCommands.TRACKED_EXPLORER_COMPARE_SELECTED,
    'compareFiles'
  )

  registerExternalCommand(
    RegisteredCommands.TRACKED_EXPLORER_FIND_IN_FOLDER,
    'filesExplorer.findInFolder'
  )
  registerExternalCommand(
    RegisteredCommands.TRACKED_EXPLORER_COPY_FILE_PATH,
    'copyFilePath'
  )

  registerExternalCommand(
    RegisteredCommands.TRACKED_EXPLORER_COPY_REL_FILE_PATH,
    'copyRelativeFilePath'
  )
}
