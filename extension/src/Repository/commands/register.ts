import { Disposable } from '@hediet/std/disposable'
import { CliExecutor } from '../../cli/executor'
import {
  registerResourceUriCommand,
  registerRootUriCommand
} from '../../vscode/commands'

export const registerRepositoryCommands = (cliExecutor: CliExecutor) => {
  const disposer = Disposable.fn()

  disposer.track(
    registerResourceUriCommand('dvc.addTarget', cliExecutor.addTarget)
  )

  disposer.track(registerRootUriCommand('dvc.checkout', cliExecutor.checkout))

  disposer.track(
    registerResourceUriCommand('dvc.checkoutTarget', cliExecutor.checkoutTarget)
  )

  disposer.track(registerRootUriCommand('dvc.commit', cliExecutor.commit))

  disposer.track(
    registerResourceUriCommand('dvc.commitTarget', cliExecutor.commitTarget)
  )

  disposer.track(
    disposer.track(registerRootUriCommand('dvc.pull', cliExecutor.pull))
  )

  disposer.track(registerRootUriCommand('dvc.push', cliExecutor.push))

  return disposer
}
