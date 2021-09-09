import {
  getResourceCommand,
  getRootCommand,
  getSimpleResourceCommand,
  Resource,
  Root
} from '.'
import { RegisteredCommands } from '../../commands/external'
import { AvailableCommands, InternalCommands } from '../../commands/internal'

const registerResourceCommands = (internalCommands: InternalCommands): void => {
  internalCommands.registerExternalCommand<Resource>(
    RegisteredCommands.ADD_TARGET,
    getSimpleResourceCommand(internalCommands, AvailableCommands.ADD)
  )

  internalCommands.registerExternalCommand<Resource>(
    RegisteredCommands.CHECKOUT_TARGET,
    getResourceCommand(internalCommands, AvailableCommands.CHECKOUT)
  )

  internalCommands.registerExternalCommand<Resource>(
    RegisteredCommands.COMMIT_TARGET,
    getResourceCommand(internalCommands, AvailableCommands.COMMIT)
  )
}

const registerRootCommands = (internalCommands: InternalCommands) => {
  internalCommands.registerExternalCommand<Root>(
    RegisteredCommands.CHECKOUT,
    getRootCommand(internalCommands, AvailableCommands.CHECKOUT)
  )

  internalCommands.registerExternalCommand<Root>(
    RegisteredCommands.COMMIT,
    getRootCommand(internalCommands, AvailableCommands.COMMIT)
  )

  internalCommands.registerExternalCommand<Root>(
    RegisteredCommands.PULL,
    getRootCommand(internalCommands, AvailableCommands.PULL)
  )

  internalCommands.registerExternalCommand<Root>(
    RegisteredCommands.PUSH,
    getRootCommand(internalCommands, AvailableCommands.PUSH)
  )
}

export const registerRepositoryCommands = (
  internalCommands: InternalCommands
): void => {
  registerResourceCommands(internalCommands)
  registerRootCommands(internalCommands)
}
