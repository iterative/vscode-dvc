import { window } from 'vscode'
import {
  experimentApply,
  experimentRemove,
  experimentRunQueue
} from '../../cli/executor'
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
