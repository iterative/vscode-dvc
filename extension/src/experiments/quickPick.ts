import { GcPreserveFlag } from '../cli/constants'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'
import { Title } from '../vscode/title'
import { Toast } from '../vscode/toast'

export const pickExperiment = (
  experiments: {
    label: string
    displayNameOrParent?: string
    id: string
    name?: string
  }[],
  title: Title = Title.SELECT_EXPERIMENT
): Thenable<{ id: string; name: string } | undefined> | undefined => {
  if (experiments.length === 0) {
    Toast.showError('There are no experiments to select.')
  } else {
    return quickPickValue<{ id: string; name: string }>(
      experiments.map(({ label, displayNameOrParent, id, name }) => ({
        description: displayNameOrParent,
        label,
        value: { id, name: name || label }
      })),
      { title }
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
    {
      placeHolder: 'Select which experiments to preserve',
      title: Title.GARBAGE_COLLECT_EXPERIMENTS
    }
  )
