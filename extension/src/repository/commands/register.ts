import { commands } from 'vscode'
import {
  getResourceCommand,
  getRootCommand_,
  getSimpleResourceCommand,
  ResourceCommand,
  RootCommand
} from '.'
import { InternalCommands } from '../../internalCommands'

const registerCommand = (name: string, func: ResourceCommand | RootCommand) =>
  commands.registerCommand(name, func)

const registerAddCommand = (internalCommands: InternalCommands): void => {
  internalCommands.dispose.track(
    registerCommand(
      'dvc.addTarget',
      getSimpleResourceCommand(internalCommands, 'add')
    )
  )
}

const registerCheckoutCommands = (internalCommands: InternalCommands): void => {
  internalCommands.dispose.track(
    registerCommand(
      'dvc.checkout',
      getRootCommand_(internalCommands, 'checkout')
    )
  )

  internalCommands.dispose.track(
    registerCommand(
      'dvc.checkoutTarget',
      getResourceCommand(internalCommands, 'checkout')
    )
  )
}

const registerCommitCommands = (internalCommands: InternalCommands): void => {
  internalCommands.dispose.track(
    registerCommand(
      'dvc.commitTarget',
      getResourceCommand(internalCommands, 'commit')
    )
  )

  internalCommands.dispose.track(
    registerCommand('dvc.commit', getRootCommand_(internalCommands, 'commit'))
  )
}

const registerPullCommand = (internalCommands: InternalCommands) => {
  internalCommands.dispose.track(
    registerCommand('dvc.pull', getRootCommand_(internalCommands, 'pull'))
  )
}

const registerPushCommand = (internalCommands: InternalCommands) => {
  internalCommands.dispose.track(
    registerCommand('dvc.push', getRootCommand_(internalCommands, 'push'))
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
