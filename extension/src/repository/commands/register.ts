import { relative } from 'path'
import { commands } from 'vscode'
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

const registerRootUriCommand = (
  name: string,
  func: (fsPath: string) => Promise<string>
) => commands.registerCommand(name, ({ rootUri }) => func(rootUri.fsPath))

const registerRootCommands = (cliExecutor: CliExecutor) => {
  cliExecutor.dispose.track(
    registerRootUriCommand('dvc.checkout', cliExecutor.checkout)
  )

  cliExecutor.dispose.track(
    registerRootUriCommand('dvc.commit', cliExecutor.commit)
  )

  cliExecutor.dispose.track(
    registerRootUriCommand('dvc.pull', cliExecutor.pull)
  )

  cliExecutor.dispose.track(
    registerRootUriCommand('dvc.push', cliExecutor.push)
  )
}

export const registerRepositoryCommands = (cliExecutor: CliExecutor): void => {
  registerResourceCommands(cliExecutor)
  registerRootCommands(cliExecutor)
}
