import { commands } from 'vscode'
import { Setup } from '.'
import { run } from './runner'
import { pickFocusedProjects } from './quickPick'
import { AvailableCommands, InternalCommands } from '../commands/internal'
import { Config } from '../config'
import { RegisteredCliCommands, RegisteredCommands } from '../commands/external'
import { getFirstWorkspaceFolder } from '../vscode/workspaceFolders'

export const registerSetupCommands = (
  setup: Setup,
  internalCommands: InternalCommands,
  config: Config
) => {
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
    RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE,
    () => run(setup)
  )

  setup.dispose.track(
    commands.registerCommand(RegisteredCommands.EXTENSION_SETUP_WORKSPACE, () =>
      setup.setupWorkspace()
    )
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW,
    async () => {
      await setup.showSetup()
    }
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SELECT_FOCUSED_PROJECTS,
    async () => {
      const dvcRoots = await setup.findWorkspaceDvcRoots()
      const focusedProjects = await pickFocusedProjects(
        dvcRoots,
        setup.getRoots()
      )
      if (focusedProjects) {
        config.setFocusedProjectsOption(focusedProjects)
      }
    }
  )
}
