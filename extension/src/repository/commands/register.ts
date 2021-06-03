import { CliExecutor } from '../../cli/executor'
import {
  registerRootUriCommand,
  registerResourceUriCommand
} from '../../vscode/commands'

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
