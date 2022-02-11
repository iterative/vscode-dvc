import { GcPreserveFlag } from '../cli/args'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { reportError } from '../vscode/reporting'

export const pickExperiment = (
  experiments: {
    label: string
    displayNameOrParent?: string
    id: string
    name?: string
  }[]
): Thenable<{ id: string; name: string } | undefined> | undefined => {
  if (experiments.length === 0) {
    reportError('There are no experiments to select.')
  } else {
    return quickPickValue<{ id: string; name: string }>(
      experiments.map(({ label, displayNameOrParent, id, name }) => ({
        description: displayNameOrParent,
        label,
        value: { id, name: name || label }
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
