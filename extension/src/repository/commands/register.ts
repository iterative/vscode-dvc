import { commands } from 'vscode'
import {
  getResetRootCommand,
  getResourceCommand,
  getRootCommand,
  getSimpleResourceCommand,
  Resource,
  Root
} from '.'
import { tryThenMaybeForce } from '../../cli/actions'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { AvailableCommands, InternalCommands } from '../../commands/internal'

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

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.COMMIT,
    async ({ rootUri }) => {
      const cwd = rootUri.fsPath

      await tryThenMaybeForce(internalCommands, AvailableCommands.COMMIT, cwd)
      return commands.executeCommand('workbench.scm.focus')
    }
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.PULL,
    getRootCommand(internalCommands, AvailableCommands.PULL)
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.PUSH,
    getRootCommand(internalCommands, AvailableCommands.PUSH)
  )

  internalCommands.registerExternalCommand<Root>(
    RegisteredCommands.RESET_WORKSPACE,
    getResetRootCommand(internalCommands)
  )
}

export const registerRepositoryCommands = (
  internalCommands: InternalCommands
): void => {
  registerResourceCommands(internalCommands)
  registerRootCommands(internalCommands)
}
