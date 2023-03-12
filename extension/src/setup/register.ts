import { commands } from 'vscode'
import { Setup } from '.'
import { run } from './runner'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { RegisteredCliCommands, RegisteredCommands } from '../commands/external'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'

const registerSetupConfigCommands = (
  setup: Setup,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE,
    () => run(setup)
  )

  setup.dispose.track(
    commands.registerCommand(RegisteredCommands.EXTENSION_SETUP_WORKSPACE, () =>
      setup.setupWorkspace()
    )
  )
  internalCommands.registerExternalCommand(
    RegisteredCommands.SELECT_FOCUSED_PROJECTS,
    () => setup.selectFocusedProjects()
  )
}

export const registerSetupCommands = (
  setup: Setup,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCliCommand(
    RegisteredCliCommands.INIT,
    async () => {
      const root = getFirstWorkspaceFolder()
      if (root) {
        await internalCommands.executeCommand(AvailableCommands.INIT, root)
      }
    }
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW,
    async () => {
      await setup.showSetup()
    }
  )

  registerSetupConfigCommands(setup, internalCommands)
}
