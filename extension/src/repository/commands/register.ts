import { Uri } from 'vscode'
import { getResourceCommand, getRootCommand, getSimpleResourceCommand } from '.'
import {
  RegisteredCommands,
  registerInstrumentedCommand
} from '../../commands/external'
import { AvailableCommands, InternalCommands } from '../../commands/internal'

const registerResourceCommands = (internalCommands: InternalCommands): void => {
  internalCommands.dispose.track(
    registerInstrumentedCommand<{ dvcRoot: string; resourceUri: Uri }>(
      RegisteredCommands.REPOSITORY_ADD_TARGET,
      getSimpleResourceCommand(internalCommands, AvailableCommands.ADD)
    )
  )

  internalCommands.dispose.track(
    registerInstrumentedCommand<{ dvcRoot: string; resourceUri: Uri }>(
      RegisteredCommands.REPOSITORY_CHECKOUT_TARGET,
      getResourceCommand(internalCommands, AvailableCommands.CHECKOUT)
    )
  )

  internalCommands.dispose.track(
    registerInstrumentedCommand<{ dvcRoot: string; resourceUri: Uri }>(
      RegisteredCommands.REPOSITORY_COMMIT_TARGET,
      getResourceCommand(internalCommands, AvailableCommands.COMMIT)
    )
  )
}

const registerRootCommands = (internalCommands: InternalCommands) => {
  internalCommands.dispose.track(
    registerInstrumentedCommand<{
      rootUri: Uri
    }>(
      RegisteredCommands.REPOSITORY_CHECKOUT,
      getRootCommand(internalCommands, AvailableCommands.CHECKOUT)
    )
  )

  internalCommands.dispose.track(
    registerInstrumentedCommand<{
      rootUri: Uri
    }>(
      RegisteredCommands.REPOSITORY_COMMIT,
      getRootCommand(internalCommands, AvailableCommands.COMMIT)
    )
  )

  internalCommands.dispose.track(
    registerInstrumentedCommand<{
      rootUri: Uri
    }>(
      RegisteredCommands.REPOSITORY_PULL,
      getRootCommand(internalCommands, AvailableCommands.PULL)
    )
  )

  internalCommands.dispose.track(
    registerInstrumentedCommand<{
      rootUri: Uri
    }>(
      RegisteredCommands.REPOSITORY_PUSH,
      getRootCommand(internalCommands, AvailableCommands.PUSH)
    )
  )
}

export const registerRepositoryCommands = (
  internalCommands: InternalCommands
): void => {
  registerResourceCommands(internalCommands)
  registerRootCommands(internalCommands)
}
