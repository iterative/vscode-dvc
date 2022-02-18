import { QuickPickItemKind } from 'vscode'
import omit from 'lodash.omit'
import { MAX_SELECTED_EXPERIMENTS } from './status'
import { definedAndNonEmpty } from '../../util/array'
import {
  QuickPickItemWithValue,
  quickPickLimitedValues
} from '../../vscode/quickPick'
import { reportError } from '../../vscode/reporting'
import { Experiment } from '../webview/contract'

type QuickPickItemAccumulator = {
  items: QuickPickItemWithValue<Experiment | undefined>[]
  selectedItems: QuickPickItemWithValue<Experiment | undefined>[]
}

const getCheckpointItems = (
  experiments: (Experiment & { checkpoints?: Experiment[] })[]
) =>
  experiments.reduce(
    (acc, experiment) => {
      if (experiment.checkpoints) {
        acc.items.push({
          kind: QuickPickItemKind.Separator,
          label: experiment.id,
          value: undefined
        })
      }
      const item = {
        label: experiment.label,
        value: omit(experiment, 'checkpoints')
      }

      acc.items.push(item)
      if (experiment.selected) {
        acc.selectedItems.push(item)
      }

      experiment.checkpoints?.map(checkpoint => {
        const item = {
          label: checkpoint.label,
          value: checkpoint
        }
        acc.items.push(item)
        if (checkpoint.selected) {
          acc.selectedItems.push(item)
        }
      })

      return acc
    },
    {
      items: [],
      selectedItems: []
    } as QuickPickItemAccumulator
  )

const getExperimentOnlyItems = (experiments: Experiment[]) =>
  experiments.reduce(
    (acc, experiment) => {
      const item = {
        description: experiment.displayNameOrParent,
        label: experiment.label,
        value: experiment
      }
      acc.items.push(item)
      if (experiment.selected) {
        acc.selectedItems.push(item)
      }
      return acc
    },
    {
      items: [],
      selectedItems: []
    } as QuickPickItemAccumulator
  )

const getItems = (
  experiments: (Experiment & { checkpoints?: Experiment[] })[],
  hasCheckpoints: boolean
): QuickPickItemAccumulator => {
  if (hasCheckpoints) {
    return getCheckpointItems(experiments)
  }
  return getExperimentOnlyItems(experiments)
}

export const pickExperiments = (
  experiments: (Experiment & { checkpoints?: Experiment[] })[],
  hasCheckpoints: boolean
): Promise<Experiment[] | undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return reportError('There are no experiments to select.')
  }

  const { items, selectedItems } = getItems(experiments, hasCheckpoints)

  return quickPickLimitedValues<Experiment | undefined>(
    items,
    selectedItems,
    MAX_SELECTED_EXPERIMENTS,
    'Select up to 6 experiments'
  )
}
