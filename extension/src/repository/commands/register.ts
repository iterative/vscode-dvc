import {
  getResourceCommand,
  getRootCommand,
  getSimpleResourceCommand,
  Resource,
  Root
} from '.'
import { getWarningResponse } from '../../vscode/modal'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { gitResetWorkspace } from '../../git'
import { Flag } from '../../cli/args'

const registerResourceCommands = (internalCommands: InternalCommands): void => {
  internalCommands.registerExternalCliCommand<Resource>(
    RegisteredCliCommands.ADD_TARGET,
    getSimpleResourceCommand(internalCommands, AvailableCommands.ADD)
  )

  internalCommands.registerExternalCliCommand<Resource>(
    RegisteredCliCommands.CHECKOUT_TARGET,
    getResourceCommand(internalCommands, AvailableCommands.CHECKOUT)
  )

  internalCommands.registerExternalCliCommand<Resource>(
    RegisteredCliCommands.COMMIT_TARGET,
    getResourceCommand(internalCommands, AvailableCommands.COMMIT)
  )
}

const registerRootCommands = (internalCommands: InternalCommands) => {
  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.CHECKOUT,
    getRootCommand(internalCommands, AvailableCommands.CHECKOUT)
  )

  internalCommands.registerExternalCommand<Root>(
    RegisteredCommands.RESET_WORKSPACE,
    async ({ rootUri }) => {
      const cwd = rootUri.fsPath

      const response = await getWarningResponse(
        'Are you sure you want to discard ALL workspace changes?\n' +
          'This is IRREVERSIBLE!\n' +
          'Your current working set will be FOREVER LOST if you proceed.',
        'Discard Changes'
      )

      if (response !== 'Discard Changes') {
        return
      }

      await gitResetWorkspace(cwd)

      return internalCommands.executeCommand(
        AvailableCommands.CHECKOUT,
        cwd,
        Flag.FORCE
      )
    }
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.COMMIT,
    getRootCommand(internalCommands, AvailableCommands.COMMIT)
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.PULL,
    getRootCommand(internalCommands, AvailableCommands.PULL)
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.PUSH,
    getRootCommand(internalCommands, AvailableCommands.PUSH)
  )
}

export const registerRepositoryCommands = (
  internalCommands: InternalCommands
): void => {
  registerResourceCommands(internalCommands)
  registerRootCommands(internalCommands)
}
