import { commands } from 'vscode'
import {
  getResourceCommand,
  getRootCommand,
  getSimpleResourceCommand,
  ResourceCommand,
  RootCommand
} from '.'
import { AvailableCommands, InternalCommands } from '../../internalCommands'

const registerCommand = (name: string, func: ResourceCommand | RootCommand) =>
  commands.registerCommand(name, func)

const registerAddCommand = (internalCommands: InternalCommands): void => {
  internalCommands.dispose.track(
    registerCommand(
      'dvc.addTarget',
      getSimpleResourceCommand(internalCommands, AvailableCommands.ADD)
    )
  )
}

const registerCheckoutCommands = (internalCommands: InternalCommands): void => {
  internalCommands.dispose.track(
    registerCommand(
      'dvc.checkout',
      getRootCommand(internalCommands, AvailableCommands.CHECKOUT)
    )
  )

  internalCommands.dispose.track(
    registerCommand(
      'dvc.checkoutTarget',
      getResourceCommand(internalCommands, AvailableCommands.CHECKOUT)
    )
  )
}

const registerCommitCommands = (internalCommands: InternalCommands): void => {
  internalCommands.dispose.track(
    registerCommand(
      'dvc.commit',
      getRootCommand(internalCommands, AvailableCommands.COMMIT)
    )
  )

  internalCommands.dispose.track(
    registerCommand(
      'dvc.commitTarget',
      getResourceCommand(internalCommands, AvailableCommands.COMMIT)
    )
  )
}

const registerPullCommand = (internalCommands: InternalCommands) => {
  internalCommands.dispose.track(
    registerCommand(
      'dvc.pull',
      getRootCommand(internalCommands, AvailableCommands.PULL)
    )
  )
}

const registerPushCommand = (internalCommands: InternalCommands) => {
  internalCommands.dispose.track(
    registerCommand(
      'dvc.push',
      getRootCommand(internalCommands, AvailableCommands.PUSH)
    )
  )
}

export const registerRepositoryCommands = (
  internalCommands: InternalCommands
): void => {
  registerAddCommand(internalCommands)
  registerCheckoutCommands(internalCommands)
  registerCommitCommands(internalCommands)
  registerPullCommand(internalCommands)
  registerPushCommand(internalCommands)
}
