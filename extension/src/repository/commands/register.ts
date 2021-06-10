import { relative } from 'path'
import { commands } from 'vscode'
import { getRootCommand, RootCommand } from '.'
import { CliExecutor } from '../../cli/executor'

const registerResourceUriCommand = (
  name: string,
  func: (cwd: string, relPath: string) => Promise<string>
) =>
  commands.registerCommand(name, ({ dvcRoot, resourceUri }) => {
    const relPath = relative(dvcRoot, resourceUri.fsPath)
    return func(dvcRoot, relPath)
  })

const registerResourceCommands = (cliExecutor: CliExecutor): void => {
  cliExecutor.dispose.track(
    registerResourceUriCommand('dvc.addTarget', cliExecutor.addTarget)
  )

  cliExecutor.dispose.track(
    registerResourceUriCommand('dvc.checkoutTarget', cliExecutor.checkoutTarget)
  )

  cliExecutor.dispose.track(
    registerResourceUriCommand('dvc.commitTarget', cliExecutor.commitTarget)
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
