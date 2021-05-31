import { window } from 'vscode'
import { experimentRunQueue } from '../../cli/executor'
import { ExecutionOptions } from '../../cli/execution'
import { reportErrorMessage } from '../../vscode/reporting'

export const report = async (
  func: (cwd: string, selectedExperimentName: string) => Promise<string>,
  cwd: string,
  selectedExperimentName: string
) => {
  try {
    window.showInformationMessage(
      (await func(cwd, selectedExperimentName)) || 'Operation successful.'
    )
  } catch (e) {
    reportErrorMessage(e)
  }
}

export const queueExperiment = async (
  options: ExecutionOptions
): Promise<void> => {
  try {
    window.showInformationMessage(await experimentRunQueue(options))
  } catch (e) {
    reportErrorMessage(e)
  }
}
