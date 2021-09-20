import { commands, Uri } from 'vscode'
import { RegisteredCommands } from '../commands/external'
import { InternalCommands } from '../commands/internal'

const executeCommand = (name: string, path: string) =>
  commands.executeCommand(name, Uri.file(path))

export const reRegisterVsCodeCommands = (
  internalCommands: InternalCommands
) => {
  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_COPY_FILE_PATH,
    path => executeCommand('copyFilePath', path)
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_COPY_REL_FILE_PATH,
    path => executeCommand('copyRelativeFilePath', path)
  )

  internalCommands.registerExternalCommand<Uri>(
    RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
    resource => commands.executeCommand('vscode.open', resource)
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_OPEN_TO_THE_SIDE,
    path => executeCommand('explorer.openToSide', path)
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_FIND_IN_FOLDER,
    path => executeCommand('filesExplorer.findInFolder', path)
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_SELECT_FOR_COMPARE,
    path => executeCommand('selectForCompare', path)
  )

  internalCommands.registerExternalCommand<string>(
    RegisteredCommands.TRACKED_EXPLORER_COMPARE_SELECTED,
    path => executeCommand('compareFiles', path)
  )
}
