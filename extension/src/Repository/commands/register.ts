import { commands } from 'vscode'
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

export const registerRepositoryCommands = (config: Config) => {
  const disposer = Disposable.fn()

  disposer.track(
    commands.registerCommand('dvc.addTarget', ({ resourceUri }) =>
      addTarget({
        fsPath: resourceUri.fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.checkout', ({ rootUri }) => {
      checkout({
        cwd: rootUri.fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.checkoutTarget', ({ resourceUri }) =>
      checkoutTarget({
        fsPath: resourceUri.fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.commit', ({ rootUri }) => {
      commit({
        cwd: rootUri.fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.commitTarget', ({ resourceUri }) =>
      commitTarget({
        fsPath: resourceUri.fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.pull', ({ rootUri }) => {
      pull({
        cwd: rootUri.fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.push', ({ rootUri }) => {
      push({
        cwd: rootUri.fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    })
  )
  return disposer
}
