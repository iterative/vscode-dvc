import { commands } from 'vscode'
import {
  getResourceCommand,
  getRootCommand,
  ResourceCommand,
  RootCommand
} from '.'
import { CliExecutor } from '../../cli/executor'

const registerCommand = (name: string, func: ResourceCommand | RootCommand) =>
  commands.registerCommand(name, func)

const registerResourceCommands = (cliExecutor: CliExecutor): void => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.addTarget',
      getResourceCommand(cliExecutor.addTarget, cliExecutor.forceAddTarget)
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkoutTarget',
      getResourceCommand(
        cliExecutor.checkoutTarget,
        cliExecutor.forceCheckoutTarget
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commitTarget',
      getResourceCommand(
        cliExecutor.commitTarget,
        cliExecutor.forceCommitTarget
      )
    )
  )
}

const registerRootCommands = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkout',
      getRootCommand(cliExecutor.checkout, cliExecutor.forceCheckout)
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commit',
      getRootCommand(cliExecutor.commit, cliExecutor.forceCommit)
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.pull',
      getRootCommand(cliExecutor.pull, cliExecutor.forcePull)
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.push',
      getRootCommand(cliExecutor.push, cliExecutor.forcePush)
    )
  )
}

export const registerRepositoryCommands = (cliExecutor: CliExecutor): void => {
  registerResourceCommands(cliExecutor)
  registerRootCommands(cliExecutor)
}
