import { commands } from 'vscode'
import {
  getResourceCommand,
  getRootCommand,
  getSimpleResourceCommand,
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
      getSimpleResourceCommand(cliExecutor.addTarget.bind(cliExecutor))
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkoutTarget',
      getResourceCommand(
        cliExecutor.checkoutTarget.bind(cliExecutor),
        cliExecutor.forceCheckoutTarget.bind(cliExecutor)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commitTarget',
      getResourceCommand(
        cliExecutor.commitTarget.bind(cliExecutor),
        cliExecutor.forceCommitTarget.bind(cliExecutor)
      )
    )
  )
}

const registerRootCommands = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkout',
      getRootCommand(
        cliExecutor.checkout.bind(cliExecutor),
        cliExecutor.forceCheckout.bind(cliExecutor)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commit',
      getRootCommand(
        cliExecutor.commit.bind(cliExecutor),
        cliExecutor.forceCommit.bind(cliExecutor)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.pull',
      getRootCommand(
        cliExecutor.pull.bind(cliExecutor),
        cliExecutor.forcePull.bind(cliExecutor)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.push',
      getRootCommand(
        cliExecutor.push.bind(cliExecutor),
        cliExecutor.forcePush.bind(cliExecutor)
      )
    )
  )
}

export const registerRepositoryCommands = (cliExecutor: CliExecutor): void => {
  registerResourceCommands(cliExecutor)
  registerRootCommands(cliExecutor)
}
