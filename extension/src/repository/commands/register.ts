import {
  getCommitRootCommand,
  getResetRootCommand,
  getResourceCommand,
  getRootCommand,
  getSimpleResourceCommand,
  getStageAllCommand,
  getUnstageAllCommand,
  Resource,
  Root
} from '.'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import { AvailableCommands, InternalCommands } from '../../commands/internal'
import { WorkspaceRepositories } from '../workspace'

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

const registerResourceGroupCommands = (
  repositories: WorkspaceRepositories,
  internalCommands: InternalCommands
) => {
  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.GIT_STAGE_ALL,
    getStageAllCommand(repositories, internalCommands)
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.GIT_UNSTAGE_ALL,
    getUnstageAllCommand(repositories, internalCommands)
  )
}

const registerRootCommands = (
  repositories: WorkspaceRepositories,
  internalCommands: InternalCommands
) => {
  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.CHECKOUT,
    getRootCommand(repositories, internalCommands, AvailableCommands.CHECKOUT)
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.COMMIT,
    getCommitRootCommand(repositories, internalCommands)
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.PULL,
    getRootCommand(repositories, internalCommands, AvailableCommands.PULL)
  )

  internalCommands.registerExternalCliCommand<Root>(
    RegisteredCliCommands.PUSH,
    getRootCommand(repositories, internalCommands, AvailableCommands.PUSH)
  )

  internalCommands.registerExternalCommand<Root>(
    RegisteredCommands.DISCARD_WORKSPACE_CHANGES,
    getResetRootCommand(repositories, internalCommands)
  )
}

export const registerRepositoryCommands = (
  repositories: WorkspaceRepositories,
  internalCommands: InternalCommands
): void => {
  registerResourceCommands(internalCommands)
  registerResourceGroupCommands(repositories, internalCommands)
  registerRootCommands(repositories, internalCommands)
}
