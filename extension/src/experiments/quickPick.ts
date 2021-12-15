import { GcPreserveFlag } from '../cli/args'
import { quickPickManyValues, quickPickOne } from '../vscode/quickPick'
import { reportError } from '../vscode/reporting'

export const pickExperimentName = async (
  experimentNamesPromise: Promise<string[]> | string[]
): Promise<string | undefined> => {
  const experimentNames = await experimentNamesPromise
  if (experimentNames.length === 0) {
    reportError('There are no experiments to select.')
  } else {
    return quickPickOne(experimentNames, 'Select an experiment')
  }
}

export const pickGarbageCollectionFlags = () =>
  quickPickManyValues<GcPreserveFlag>(
    [
      {
        detail: 'Preserve experiments derived from the current workspace',
        label: 'Workspace',
        picked: true,
        value: GcPreserveFlag.WORKSPACE
      },
      {
        detail: 'Preserve experiments derived from all Git branches',
        label: 'All Branches',
        value: GcPreserveFlag.ALL_BRANCHES
      },
      {
        detail: 'Preserve experiments derived from all Git tags',
        label: 'All Tags',
        value: GcPreserveFlag.ALL_TAGS
      },
      {
        detail: 'Preserve experiments derived from all Git commits',
        label: 'All Commits',
        value: GcPreserveFlag.ALL_COMMITS
      },
      {
        detail: 'Preserve all queued experiments',
        label: 'Queued Experiments',
        value: GcPreserveFlag.QUEUED
      }
    ],
    { placeHolder: 'Select which experiments to preserve' }
  )
