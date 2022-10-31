import { QuickPickItemKind } from 'vscode'
import omit from 'lodash.omit'
import get from 'lodash.get'
import { ExperimentWithCheckpoints } from '.'
import { MAX_SELECTED_EXPERIMENTS } from './status'
import { definedAndNonEmpty } from '../../util/array'
import {
  QuickPickItemWithValue,
  quickPickLimitedValues
} from '../../vscode/quickPick'
import { Toast } from '../../vscode/toast'
import { Experiment } from '../webview/contract'
import { Title } from '../../vscode/title'
import { splitColumnPath } from '../columns/paths'
import { formatDate } from '../../util/date'
import { truncateFromLeft } from '../../util/string'

type QuickPickItemAccumulator = {
  items: QuickPickItemWithValue<Experiment | undefined>[]
  selectedItems: QuickPickItemWithValue<Experiment | undefined>[]
}

const getSeparator = (experiment: Experiment) => ({
  kind: QuickPickItemKind.Separator,
  label: experiment.id,
  value: undefined
})

const getItem = (experiment: Experiment, firstThreeColumnOrder: string[]) => ({
  detail: firstThreeColumnOrder
    .map(name => {
      const splitUpName = splitColumnPath(name)
      const collectedVal = get(experiment, splitUpName)
      if (!collectedVal) {
        return null
      }
      const value =
        name === 'Created'
          ? formatDate(collectedVal)
          : collectedVal?.value || collectedVal

      return `${truncateFromLeft(
        splitUpName[splitUpName.length - 1],
        15
      )}:${value}`
    })
    .filter(Boolean)
    .join(', '),
  label: experiment.label,
  value: omit(experiment, 'checkpoints')
})

const collectItem = (
  acc: QuickPickItemAccumulator,
  experiment: Experiment,
  firstThreeColumnOrder: string[],
  transformer = getItem
) => {
  const item = transformer(experiment, firstThreeColumnOrder)
  acc.items.push(item)
  if (experiment.selected) {
    acc.selectedItems.push(item)
  }
  return acc
}

const collectFromExperiment = (
  acc: QuickPickItemAccumulator,
  experiment: ExperimentWithCheckpoints,
  firstThreeColumnOrder: string[]
): void => {
  if (experiment.checkpoints) {
    acc.items.push(getSeparator(experiment))
  }

  collectItem(acc, experiment, firstThreeColumnOrder)

  for (const checkpoint of experiment.checkpoints || []) {
    collectItem(acc, checkpoint, firstThreeColumnOrder)
  }
}

const collectCheckpointItems = (
  experiments: ExperimentWithCheckpoints[],
  firstThreeColumnOrder: string[]
) => {
  const acc: QuickPickItemAccumulator = {
    items: [],
    selectedItems: []
  }

  for (const experiment of experiments) {
    collectFromExperiment(acc, experiment, firstThreeColumnOrder)
  }

  return acc
}

const collectExperimentOnlyItems = (
  experiments: Experiment[],
  firstThreeColumnOrder: string[]
) => {
  const acc: QuickPickItemAccumulator = {
    items: [],
    selectedItems: []
  }

  for (const experiment of experiments) {
    collectItem(
      acc,
      experiment,
      firstThreeColumnOrder,
      (experiment: Experiment) => ({
        ...getItem(experiment, firstThreeColumnOrder),
        description: experiment.displayNameOrParent
      })
    )
  }

  return acc
}

const collectItems = (
  experiments: ExperimentWithCheckpoints[],
  hasCheckpoints: boolean,
  firstThreeColumnOrder: string[]
): QuickPickItemAccumulator => {
  if (hasCheckpoints) {
    return collectCheckpointItems(experiments, firstThreeColumnOrder)
  }
  return collectExperimentOnlyItems(experiments, firstThreeColumnOrder)
}

export const pickExperiments = (
  experiments: ExperimentWithCheckpoints[],
  hasCheckpoints: boolean,
  firstThreeColumnOrder: string[]
): Promise<Experiment[] | undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError('There are no experiments to select.')
  }

  const { items, selectedItems } = collectItems(
    experiments,
    hasCheckpoints,
    firstThreeColumnOrder
  )

  return quickPickLimitedValues<Experiment | undefined>(
    items,
    selectedItems,
    MAX_SELECTED_EXPERIMENTS,
    Title.SELECT_EXPERIMENTS
  )
}
