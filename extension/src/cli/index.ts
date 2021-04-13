import { basename, dirname } from 'path'
import { commands, window } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../Config'
import { Commands } from './commands'
import {
  execCommand,
  initializeDirectory,
  checkout,
  checkoutRecursive,
  queueExperiment
} from './reader'

export const add = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => {
  const { fsPath, cliPath } = options

  const cwd = dirname(fsPath)

  const toAdd = basename(fsPath)
  const addCommand = `${Commands.add} ${toAdd}`

  const { stdout } = await execCommand({ cwd, cliPath }, addCommand)
  return stdout
}

export const queueExperimentCommand = async (config: Config) => {
  try {
    return window.showInformationMessage(
      await queueExperiment({
        cwd: config.workspaceRoot,
        cliPath: config.dvcPath
      })
    )
  } catch (e) {
    return window.showErrorMessage(e.stderr || e.message)
  }
}

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
      add({ fsPath: resourceUri.fsPath, cliPath: config.dvcPath })
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

  disposer.track(
    commands.registerCommand('dvc.queueExperiment', async () => {
      return queueExperimentCommand(config)
    })
  )
}
