import { Disposable } from '@hediet/std/disposable'
import { Config } from '../../Config'
import {
  addTarget,
  checkoutTarget,
  CliExecutor,
  commitTarget,
  pull
} from '../../cli/executor'
import {
  registerResourceUriCommand,
  registerRootUriCommand,
  registerRootUriCommand_
} from '../../vscode/commands'

export const registerRepositoryCommands = (
  config: Config,
  cliExecutor: CliExecutor
) => {
  const disposer = Disposable.fn()

  disposer.track(registerResourceUriCommand(config, 'dvc.addTarget', addTarget))

  disposer.track(registerRootUriCommand_('dvc.checkout', cliExecutor.checkout))

  disposer.track(
    registerResourceUriCommand(config, 'dvc.checkoutTarget', checkoutTarget)
  )

  disposer.track(registerRootUriCommand_('dvc.commit', cliExecutor.commit))

  disposer.track(
    registerResourceUriCommand(config, 'dvc.commitTarget', commitTarget)
  )

  disposer.track(
    disposer.track(registerRootUriCommand(config, 'dvc.pull', pull))
  )

  disposer.track(registerRootUriCommand_('dvc.push', cliExecutor.push))

  return disposer
}
