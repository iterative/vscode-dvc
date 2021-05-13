import { window } from 'vscode'
import { Config } from '../Config'
import { reportStderrOrThrow } from '../vscode/reporting'
import { experimentRunQueue } from './executor'

export const experimentRunQueueCommand = async (config: Config) => {
  try {
    return window.showInformationMessage(
      await experimentRunQueue({
        cwd: config.workspaceRoot,
        cliPath: config.getCliPath(),
        pythonBinPath: config.pythonBinPath
      })
    )
  } catch (e) {
    reportStderrOrThrow(e)
  }
}
