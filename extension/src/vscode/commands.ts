import { commands, Uri } from 'vscode'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'

const getCommand =
  (name: string): ((path: string) => void) =>
  path =>
    commands.executeCommand(name, Uri.file(path))

const registerPathCommands = (internalCommands: InternalCommands) => {
  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_OPEN_TO_THE_SIDE,
    getCommand('explorer.openToSide')
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_SELECT_FOR_COMPARE,
    getCommand('selectForCompare')
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_COMPARE_SELECTED,
    getCommand('compareFiles')
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_FIND_IN_FOLDER,
    getCommand('filesExplorer.findInFolder')
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_COPY_FILE_PATH,
    getCommand('copyFilePath')
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_COPY_REL_FILE_PATH,
    getCommand('copyRelativeFilePath')
  )
}

export const reRegisterVsCodeCommands = (
  internalCommands: InternalCommands
) => {
  internalCommands.registerExternalCommand<Uri>(
    RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
    resource => commands.executeCommand('vscode.open', resource)
  )

  registerPathCommands(internalCommands)
}
