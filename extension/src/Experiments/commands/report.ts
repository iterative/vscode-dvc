import { window } from 'vscode'
import { experimentRunQueue } from '../../cli/executor'
import { ExecutionOptions } from '../../cli/execution'
import { reportErrorMessage } from '../../vscode/reporting'

export const queueExperiment = async (
  options: ExecutionOptions
): Promise<void> => {
  try {
    window.showInformationMessage(await experimentRunQueue(options))
  } catch (e) {
    reportErrorMessage(e)
  }
}
