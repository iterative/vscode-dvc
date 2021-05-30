import { window } from 'vscode'
import { experimentRemove, experimentRunQueue } from '../../cli/executor'
import { ExecutionOptions } from '../../cli/execution'
import { reportErrorMessage } from '../../vscode/reporting'

export const report = async (
  func: (cwd: string, selectedExperimentName: string) => Promise<string>,
  cwd: string,
  selectedExperimentName: string
) => {
  try {
    window.showInformationMessage(await func(cwd, selectedExperimentName))
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

export const removeExperiment = async (
  options: ExecutionOptions,
  selectedExperimentName: string
) => {
  try {
    await experimentRemove(options, selectedExperimentName)
    window.showInformationMessage(
      `Experiment ${selectedExperimentName} has been removed!`
    )
  } catch (e) {
    reportErrorMessage(e)
  }
}
