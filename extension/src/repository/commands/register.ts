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
      getSimpleResourceCommand((cwd: string, target: string) =>
        cliExecutor.addTarget(cwd, target)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkoutTarget',
      getResourceCommand(
        (cwd: string, target: string) =>
          cliExecutor.checkoutTarget(cwd, target),
        (cwd: string, target: string) =>
          cliExecutor.forceCheckoutTarget(cwd, target)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commitTarget',
      getResourceCommand(
        (cwd: string, target: string) => cliExecutor.commitTarget(cwd, target),
        (cwd: string, target: string) =>
          cliExecutor.forceCommitTarget(cwd, target)
      )
    )
  )
}

const registerRootCommands = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerCommand(
      'dvc.checkout',
      getRootCommand(
        (cwd: string) => cliExecutor.checkout(cwd),
        (cwd: string) => cliExecutor.forceCheckout(cwd)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.commit',
      getRootCommand(
        (cwd: string) => cliExecutor.commit(cwd),
        (cwd: string) => cliExecutor.forceCommit(cwd)
      )
    )
  )

  cliExecutor.dispose.track(
    registerCommand(
      'dvc.pull',
      getRootCommand(
        (cwd: string) => cliExecutor.pull(cwd),
        (cwd: string) => cliExecutor.forcePull(cwd)
      )
    )
  )

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
  registerResourceCommands(cliExecutor)
  registerRootCommands(cliExecutor)
}
