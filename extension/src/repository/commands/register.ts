import { commands } from 'vscode'
import {
  getResourceCommand,
  getRootCommand,
  ResourceCommand,
  RootCommand
} from '.'
import { CliExecutor } from '../../cli/executor'

const registerResourceUriCommand = (name: string, func: ResourceCommand) =>
  commands.registerCommand(name, func)

const registerResourceCommands = (cliExecutor: CliExecutor): void => {
  cliExecutor.dispose.track(
    registerResourceUriCommand(
      'dvc.addTarget',
      getResourceCommand(cliExecutor.addTarget, cliExecutor.forceAddTarget)
    )
  )

  cliExecutor.dispose.track(
    registerResourceUriCommand(
      'dvc.checkoutTarget',
      getResourceCommand(
        cliExecutor.checkoutTarget,
        cliExecutor.forceCheckoutTarget
      )
    )
  )

  cliExecutor.dispose.track(
    registerResourceUriCommand(
      'dvc.commitTarget',
      getResourceCommand(
        cliExecutor.commitTarget,
        cliExecutor.forceCommitTarget
      )
    )
  )
}

const registerRootUriCommand = (name: string, func: RootCommand) =>
  commands.registerCommand(name, func)

const registerRootCommands = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerRootUriCommand(
      'dvc.checkout',
      getRootCommand(cliExecutor.checkout, cliExecutor.forceCheckout)
    )
  )

  cliExecutor.dispose.track(
    registerRootUriCommand(
      'dvc.commit',
      getRootCommand(cliExecutor.commit, cliExecutor.forceCommit)
    )
  )

  cliExecutor.dispose.track(
    registerRootUriCommand(
      'dvc.pull',
      getRootCommand(cliExecutor.pull, cliExecutor.forcePull)
    )
  )

  cliExecutor.dispose.track(
    registerRootUriCommand(
      'dvc.push',
      getRootCommand(cliExecutor.push, cliExecutor.forcePush)
    )
  )
}

export const registerRepositoryCommands = (cliExecutor: CliExecutor): void => {
  registerResourceCommands(cliExecutor)
  registerRootCommands(cliExecutor)
}
