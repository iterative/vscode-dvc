import { CliExecutor } from '../../cli/executor'
import { registerUriCommand } from '../../vscode/commands'

const registerResourceCommands = (cliExecutor: CliExecutor): void => {
  const type = 'resourceUri'

  cliExecutor.dispose.track(
    registerUriCommand('dvc.addTarget', type, cliExecutor.addTarget)
  )

  cliExecutor.dispose.track(
    registerUriCommand('dvc.checkoutTarget', type, cliExecutor.checkoutTarget)
  )

  cliExecutor.dispose.track(
    registerUriCommand('dvc.commitTarget', type, cliExecutor.commitTarget)
  )
}

const registerRootCommands = (cliExecutor: CliExecutor) => {
  const type = 'rootUri'

  cliExecutor.dispose.track(
    registerUriCommand('dvc.checkout', type, cliExecutor.checkout)
  )

  cliExecutor.dispose.track(
    registerUriCommand('dvc.commit', type, cliExecutor.commit)
  )

  cliExecutor.dispose.track(
    registerUriCommand('dvc.pull', type, cliExecutor.pull)
  )

  cliExecutor.dispose.track(
    registerUriCommand('dvc.push', type, cliExecutor.push)
  )
}

export const registerRepositoryCommands = (cliExecutor: CliExecutor): void => {
  registerResourceCommands(cliExecutor)
  registerRootCommands(cliExecutor)
}
