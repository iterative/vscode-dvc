import { Disposable } from '@hediet/std/disposable'
import { Config } from '../../Config'
import {
  addTarget,
  checkoutTarget,
  CliExecutor,
  commitTarget
} from '../../cli/executor'
import {
  registerResourceUriCommand,
  registerRootUriCommand
} from '../../vscode/commands'

export const registerRepositoryCommands = (
  config: Config,
  cliExecutor: CliExecutor
) => {
  const disposer = Disposable.fn()

  disposer.track(registerResourceUriCommand(config, 'dvc.addTarget', addTarget))

  disposer.track(registerRootUriCommand('dvc.checkout', cliExecutor.checkout))

  disposer.track(
    registerResourceUriCommand(config, 'dvc.checkoutTarget', checkoutTarget)
  )

  disposer.track(registerRootUriCommand('dvc.commit', cliExecutor.commit))

  disposer.track(
    registerResourceUriCommand(config, 'dvc.commitTarget', commitTarget)
  )

  disposer.track(
    disposer.track(registerRootUriCommand('dvc.pull', cliExecutor.pull))
  )

  disposer.track(registerRootUriCommand('dvc.push', cliExecutor.push))

  return disposer
}
