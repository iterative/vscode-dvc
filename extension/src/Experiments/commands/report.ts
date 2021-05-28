import { window } from 'vscode'
import { experimentApply, experimentRunQueue } from '../../cli/executor'
import { ExecutionOptions } from '../../cli/execution'
import { reportErrorMessage } from '../../vscode/reporting'

export const applyExperiment = async (
  options: ExecutionOptions,
  selectedExperimentName: string
) => {
  try {
    window.showInformationMessage(
      await experimentApply(options, selectedExperimentName)
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
