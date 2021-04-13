import { basename, dirname } from 'path'
import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../Config'
import { Commands, getCommandWithTarget } from './commands'
import {
  execCommand,
  initializeDirectory,
  checkout,
  checkoutRecursive
} from './reader'

const runTargetCommand = async (
  options: {
    fsPath: string
    cliPath: string | undefined
  },
  command: Commands
): Promise<string> => {
  const { fsPath, cliPath } = options

  const cwd = dirname(fsPath)

  const target = basename(fsPath)
  const commandWithTarget = getCommandWithTarget(command, target)

  const { stdout } = await execCommand({ cwd, cliPath }, commandWithTarget)
  return stdout
}

export const addTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.ADD)

export const pushTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.PUSH)

export const pullTarget = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => runTargetCommand(options, Commands.PULL)

export const registerCommands = (config: Config, disposer: Disposer) => {
  disposer.track(
    commands.registerCommand('dvc.initializeDirectory', ({ fsPath }) => {
      initializeDirectory({
        cwd: fsPath,
        cliPath: config.dvcPath
      })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.add', ({ resourceUri }) =>
      addTarget({ fsPath: resourceUri.fsPath, cliPath: config.dvcPath })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.push', ({ resourceUri }) =>
      pushTarget({ fsPath: resourceUri.fsPath, cliPath: config.dvcPath })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.pull', ({ resourceUri }) =>
      pullTarget({ fsPath: resourceUri.fsPath, cliPath: config.dvcPath })
    )
  )

  disposer.track(
    commands.registerCommand('dvc.checkout', ({ fsPath }) => {
      checkout({ cwd: fsPath, cliPath: config.dvcPath })
    })
  )

  disposer.track(
    commands.registerCommand('dvc.checkoutRecursive', ({ fsPath }) => {
      checkoutRecursive({ cwd: fsPath, cliPath: config.dvcPath })
    })
  )
}
