import { window } from 'vscode'
import { GcPreserveFlag } from '../cli/args'
import { quickPickManyValues } from '../vscode/quickPick'

export const pickExperimentName = async (
  experimentNamesPromise: Promise<string[]>
): Promise<string | undefined> => {
  const experimentNames = await experimentNamesPromise
  if (experimentNames.length === 0) {
    window.showErrorMessage('There are no experiments to select.')
  } else {
    return window.showQuickPick(experimentNames)
  }
}

export const pickGarbageCollectionFlags = () =>
  quickPickManyValues<GcPreserveFlag>(
    [
      {
        detail: 'Preserve Experiments derived from all Git branches',
        label: 'All Branches',
        value: GcPreserveFlag.ALL_BRANCHES
      },
      {
        detail: 'Preserve Experiments derived from all Git tags',
        label: 'All Tags',
        value: GcPreserveFlag.ALL_TAGS
      },
      {
        detail: 'Preserve Experiments derived from all Git commits',
        label: 'All Commits',
        value: GcPreserveFlag.ALL_COMMITS
      },
      {
        detail: 'Preserve all queued Experiments',
        label: 'Queued Experiments',
        value: GcPreserveFlag.QUEUED
      }
    ],
    { placeHolder: 'Select which Experiments to preserve' }
  )
