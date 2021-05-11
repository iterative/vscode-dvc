import { commands } from 'vscode'
import { Disposer } from '@hediet/std/disposable'
import { Config } from '../Config'
import { initializeDirectory } from './executor'

export const registerCliCommands = (config: Config, disposer: Disposer) => {
  disposer.track(
    commands.registerCommand('dvc.initializeDirectory', ({ fsPath }) => {
      initializeDirectory({
        cwd: fsPath,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    })
  )
}
