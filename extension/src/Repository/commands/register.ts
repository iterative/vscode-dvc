import { commands } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../../Config'
import {
  ExecutionOnTargetOptions,
  addTarget,
  checkout,
  checkoutTarget,
  commit,
  commitTarget,
  pull,
  push
} from '../../cli/executor'
import { ExecutionOptions } from '../../cli/execution'

const registerRootUriCommand = (
  config: Config,
  name: string,
  func: (options: ExecutionOptions) => Promise<string>
) =>
  commands.registerCommand(name, ({ rootUri }) =>
    func({
      cwd: rootUri.fsPath,
      cliPath: config.getCliPath(),
      pythonBinPath: config.pythonBinPath
    })
  )

const registerResourceUriCommand = (
  config: Config,
  name: string,
  func: (options: ExecutionOnTargetOptions) => Promise<string>
) =>
  commands.registerCommand(name, ({ resourceUri }) =>
    func({
      fsPath: resourceUri.fsPath,
      cliPath: config.getCliPath(),
      pythonBinPath: config.pythonBinPath
    })
  )

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
