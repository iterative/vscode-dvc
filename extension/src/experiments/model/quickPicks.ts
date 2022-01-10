import { definedAndNonEmpty } from '../../util/array'
import { quickPickManyValues } from '../../vscode/quickPick'
import { reportError } from '../../vscode/reporting'
import { Experiment } from '../webview/contract'

export const pickExperiments = (
  experiments: Experiment[]
): Thenable<string[] | undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return reportError('There are no experiments to select.')
  }

  return quickPickManyValues<string>(
    experiments.map(experiment => ({
      description: experiment.displayNameOrParent,
      label: experiment.displayId,
      picked: experiment.selected,
      value: experiment.id
    })),
    {
      title: 'Select experiments'
    }
  )
}
