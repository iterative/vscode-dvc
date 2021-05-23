import { window } from 'vscode'
import { experimentRunQueue } from '../../cli/executor'
import { ExecutionOptions } from '../../cli/execution'

export const queueExperiment = async (options: ExecutionOptions) => {
  return window.showInformationMessage(await experimentRunQueue(options))
}
