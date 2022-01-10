import { GcPreserveFlag } from '../cli/args'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { reportError } from '../vscode/reporting'

export const pickExperimentName = (
  experimentDetails: {
    displayId: string
    displayNameOrParent?: string
    id: string
  }[]
): Thenable<string | undefined> | undefined => {
  if (experimentDetails.length === 0) {
    reportError('There are no experiments to select.')
  } else {
    return quickPickValue(
      experimentDetails.map(({ displayId, id, displayNameOrParent }) => ({
        description: displayNameOrParent,
        label: displayId,
        value: id
      })),
      { title: 'Select an experiment' }
    )
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
