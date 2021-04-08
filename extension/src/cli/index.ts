import { Disposer } from '@hediet/std/disposable'
import { basename, dirname } from 'path'
import { commands } from 'vscode'
import { Config } from '../Config'
import { Commands, getAddCommand } from './commands'
import {
  execCommand,
  ReaderOptions,
  initializeDirectory,
  checkout,
  checkoutRecursive
} from './reader'

export const add = async (options: {
  fsPath: string
  cliPath: string | undefined
}): Promise<string> => {
  const { fsPath, cliPath } = options

  const cwd = dirname(fsPath)

  const toAdd = basename(fsPath)
  const addCommand = getAddCommand(toAdd)

  const { stdout } = await execCommand({ cwd, cliPath }, addCommand)
  return stdout
}

export const getStatus = async (
  options: ReaderOptions
): Promise<Record<string, string>> => {
  const { stdout } = await execCommand(options, Commands.status)
  const status = JSON.parse(stdout)

  const excludeAlwaysChanged = (key: string): boolean =>
    !status[key].includes('always changed')

  const getChanged = (
    status: Record<string, Record<string, string>>[]
  ): Record<string, string>[] =>
    status
      .map(entry => entry?.['changed outs'] || entry?.['changed deps'])
      .filter(value => value)

  const statusReducer = (
    reducedStatus: Record<string, string>,
    key: string
  ): Record<string, string> => {
    const changed = getChanged(status[key])
    return Object.assign(reducedStatus, ...changed)
  }

  return Object.keys(status)
    .filter(excludeAlwaysChanged)
    .reduce(statusReducer, {})
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
}
