import { commands } from 'vscode'
import { Config } from '../Config'
import { Disposer } from '../extension'
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
