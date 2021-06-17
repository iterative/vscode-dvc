import { commands } from 'vscode'
import {
  getResourceCommand,
  getRootCommand,
  getRootCommand_,
  getSimpleResourceCommand,
  ResourceCommand,
  RootCommand
} from '.'
import { Args } from '../../cli/args'
import { CliExecutor } from '../../cli/executor'

const registerCommand = (name: string, func: ResourceCommand | RootCommand) =>
  commands.registerCommand(name, func)

const registerAddCommand = (cliExecutor: CliExecutor): void => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.addTarget',
      getSimpleResourceCommand((cwd: string, target: string) =>
        cliExecutor.addTarget(cwd, target)
      )
    )
  )
}

const registerCheckoutCommands = (cliExecutor: CliExecutor): void => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkout',
      getRootCommand_((cwd: string, ...args: Args) =>
        cliExecutor.checkout(cwd, ...args)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkoutTarget',
      getResourceCommand((cwd: string, target: string, ...args: Args) =>
        cliExecutor.checkoutTarget(cwd, target, ...args)
      )
    )
  )
}

const registerCommitCommands = (cliExecutor: CliExecutor): void => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commitTarget',
      getResourceCommand((cwd: string, target: string, ...args: Args) =>
        cliExecutor.commitTarget(cwd, target, ...args)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commit',
      getRootCommand_((cwd: string, ...args: Args) =>
        cliExecutor.commit(cwd, ...args)
      )
    )
  )
}

const registerPullCommand = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.pull',
      getRootCommand(
        (cwd: string) => cliExecutor.pull(cwd),
        (cwd: string) => cliExecutor.forcePull(cwd)
      )
    )
  )
}

const registerPushCommand = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.push',
      getRootCommand(
        (cwd: string) => cliExecutor.push(cwd),
        (cwd: string) => cliExecutor.forcePush(cwd)
      )
    )
  )
}

export const registerRepositoryCommands = (cliExecutor: CliExecutor): void => {
  registerAddCommand(cliExecutor)
  registerCheckoutCommands(cliExecutor)
  registerCommitCommands(cliExecutor)
  registerPullCommand(cliExecutor)
  registerPushCommand(cliExecutor)
}
