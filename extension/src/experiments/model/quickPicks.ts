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

const getSeparator = (experiment: Experiment) => ({
  kind: QuickPickItemKind.Separator,
  label: experiment.id,
  value: undefined
})

const getItem = (experiment: Experiment) => ({
  label: experiment.label,
  value: omit(experiment, 'checkpoints')
})

const collectItem = (
  acc: QuickPickItemAccumulator,
  experiment: Experiment,
  transformer = getItem
) => {
  const item = transformer(experiment)
  acc.items.push(item)
  if (experiment.selected) {
    acc.selectedItems.push(item)
  }
  return acc
}

const collectCheckpointItems = (
  experiments: (Experiment & { checkpoints?: Experiment[] })[]
) =>
  experiments.reduce(
    (acc, experiment) => {
      if (experiment.checkpoints) {
        acc.items.push(getSeparator(experiment))
      }

      collectItem(acc, experiment)

      experiment.checkpoints?.map(checkpoint => {
        return collectItem(acc, checkpoint)
      })

      return acc
    },
    {
      items: [],
      selectedItems: []
    } as QuickPickItemAccumulator
  )

const collectExperimentOnlyItems = (experiments: Experiment[]) =>
  experiments.reduce(
    (acc, experiment) =>
      collectItem(acc, experiment, (experiment: Experiment) => ({
        ...getItem(experiment),
        description: experiment.displayNameOrParent
      })),
    {
      items: [],
      selectedItems: []
    } as QuickPickItemAccumulator
  )

const collectItems = (
  experiments: (Experiment & { checkpoints?: Experiment[] })[],
  hasCheckpoints: boolean
): QuickPickItemAccumulator => {
  if (hasCheckpoints) {
    return collectCheckpointItems(experiments)
  }
  return collectExperimentOnlyItems(experiments)
}

export const pickExperiments = (
  experiments: (Experiment & { checkpoints?: Experiment[] })[],
  hasCheckpoints: boolean
): Promise<Experiment[] | undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return reportError('There are no experiments to select.')
  }

  const { items, selectedItems } = collectItems(experiments, hasCheckpoints)

  return quickPickLimitedValues<Experiment | undefined>(
    items,
    selectedItems,
    MAX_SELECTED_EXPERIMENTS,
    'Select up to 6 experiments'
  )
}
