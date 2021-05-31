import { Disposable } from '@hediet/std/disposable'
import { CliExecutor } from '../../cli/executor'
import { registerUriCommand } from '../../vscode/commands'

export const registerRepositoryCommands = (cliExecutor: CliExecutor) => {
  const disposer = Disposable.fn()

  disposer.track(
    registerUriCommand('dvc.addTarget', 'resourceUri', cliExecutor.addTarget)
  )

  disposer.track(
    registerUriCommand('dvc.checkout', 'rootUri', cliExecutor.checkout)
  )

  disposer.track(
    registerUriCommand(
      'dvc.checkoutTarget',
      'resourceUri',
      cliExecutor.checkoutTarget
    )
  )

  disposer.track(
    registerUriCommand('dvc.commit', 'rootUri', cliExecutor.commit)
  )

  disposer.track(
    registerUriCommand(
      'dvc.commitTarget',
      'resourceUri',
      cliExecutor.commitTarget
    )
  )

  disposer.track(
    disposer.track(registerUriCommand('dvc.pull', 'rootUri', cliExecutor.pull))
  )

  disposer.track(registerUriCommand('dvc.push', 'rootUri', cliExecutor.push))

  return disposer
}
