import { commands } from 'vscode'
import {
  getResourceCommand,
  getRootCommand,
  getSimpleResourceCommand,
  ResourceCommand,
  RootCommand
} from '.'
import { Args } from '../../cli/args'
import { CliExecutor } from '../../cli/executor'
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

const registerCheckoutCommands = (cliExecutor: CliExecutor): void => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkout',
      getRootCommand((cwd: string, ...args: Args) =>
        cliExecutor.checkout(cwd, ...args)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkoutTarget',
      getResourceCommand((cwd: string, target: string, ...args: Args) =>
        cliExecutor.checkout(cwd, target, ...args)
      )
    )
  )
}

const registerCommitCommands = (cliExecutor: CliExecutor): void => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commitTarget',
      getResourceCommand((cwd: string, target: string, ...args: Args) =>
        cliExecutor.commit(cwd, target, ...args)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commit',
      getRootCommand((cwd: string, ...args: Args) =>
        cliExecutor.commit(cwd, ...args)
      )
    )
  )
}

const registerPullCommand = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.pull',
      getRootCommand((cwd: string, ...args: Args) =>
        cliExecutor.pull(cwd, ...args)
      )
    )
  )
}

const registerPushCommand = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.push',
      getRootCommand((cwd: string, ...args: Args) =>
        cliExecutor.push(cwd, ...args)
      )
    )
  )
}

export const registerRepositoryCommands = (
  cliExecutor: CliExecutor,
  internalCommands: InternalCommands
): void => {
  registerAddCommand(internalCommands)
  registerCheckoutCommands(cliExecutor)
  registerCommitCommands(cliExecutor)
  registerPullCommand(cliExecutor)
  registerPushCommand(cliExecutor)
}
