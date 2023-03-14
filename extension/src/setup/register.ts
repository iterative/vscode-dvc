import { commands } from 'vscode'
import { Setup } from '.'
import { run } from './runner'
import { Section } from './webview/contract'
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

const registerSetupShowCommands = (
  setup: Setup,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW,
    async () => {
      await setup.showSetup()
    }
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW_EXPERIMENTS,
    async () => {
      await setup.showSetup(Section.EXPERIMENTS)
    }
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.SETUP_SHOW_STUDIO,
    async () => {
      await setup.showSetup(Section.STUDIO)
    }
  )
}

const registerSetupStudioCommands = (
  setup: Setup,
  internalCommands: InternalCommands
): void => {
  internalCommands.registerExternalCommand(
    RegisteredCommands.ADD_STUDIO_ACCESS_TOKEN,
    () => setup.saveStudioAccessToken()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.UPDATE_STUDIO_ACCESS_TOKEN,
    () => setup.saveStudioAccessToken()
  )

  internalCommands.registerExternalCommand(
    RegisteredCommands.REMOVE_STUDIO_ACCESS_TOKEN,
    () => setup.removeStudioAccessToken()
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

  registerSetupConfigCommands(setup, internalCommands)
  registerSetupShowCommands(setup, internalCommands)
  registerSetupStudioCommands(setup, internalCommands)
}
