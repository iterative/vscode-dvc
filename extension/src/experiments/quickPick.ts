import { GcPreserveFlag, QueueRemoveFlag } from '../cli/dvc/constants'
import { quickPickManyValues } from '../vscode/quickPick'
import { Title } from '../vscode/title'

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

export const pickQueueRemoveFlags = () =>
  quickPickManyValues<QueueRemoveFlag>(
    [
      {
        label: 'All',
        picked: true,
        value: QueueRemoveFlag.ALL
      },
      {
        label: 'Successful',
        value: QueueRemoveFlag.SUCCESS
      },
      {
        label: 'Failed',
        value: QueueRemoveFlag.FAILED
      },
      {
        label: 'Queued',
        value: QueueRemoveFlag.QUEUED
      }
    ],
    {
      placeHolder: 'Select task type(s) to remove',
      title: Title.QUEUE_REMOVE
    }
  )
