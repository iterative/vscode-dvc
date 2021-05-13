import { window } from 'vscode'
import { reportStderrOrThrow } from '../../vscode/reporting'
import { experimentRunQueue } from '../../cli/executor'
import { ExecutionOptions } from '../../cli/execution'

export const queueExperiment = async (options: ExecutionOptions) => {
  try {
    return window.showInformationMessage(await experimentRunQueue(options))
  } catch (e) {
    reportStderrOrThrow(e)
  }
}
