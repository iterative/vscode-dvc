import { Disposable } from '@hediet/std/disposable'
import { Config } from '../../Config'
import {
  addTarget,
  checkout,
  checkoutTarget,
  commit,
  commitTarget,
  pull,
  push
} from '../../cli/executor'
import {
  registerResourceUriCommand,
  registerRootUriCommand
} from '../../vscode/commands'

export const registerRepositoryCommands = (config: Config) => {
  const disposer = Disposable.fn()

  disposer.track(registerResourceUriCommand(config, 'dvc.addTarget', addTarget))

  disposer.track(registerRootUriCommand(config, 'dvc.checkout', checkout))

  disposer.track(
    registerResourceUriCommand(config, 'dvc.checkoutTarget', checkoutTarget)
  )

  disposer.track(registerRootUriCommand(config, 'dvc.commit', commit))

  disposer.track(
    registerResourceUriCommand(config, 'dvc.commitTarget', commitTarget)
  )

  disposer.track(
    disposer.track(registerRootUriCommand(config, 'dvc.pull', pull))
  )

  disposer.track(registerRootUriCommand(config, 'dvc.push', push))

  return disposer
}
