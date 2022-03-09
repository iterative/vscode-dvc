import { QuickPickItemKind } from 'vscode'
import omit from 'lodash.omit'
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

const collectCheckpointItems = (experiments: ExperimentWithCheckpoints[]) => {
  const acc: QuickPickItemAccumulator = {
    items: [],
    selectedItems: []
  }

  experiments.forEach(experiment => {
    if (experiment.checkpoints) {
      acc.items.push(getSeparator(experiment))
    }

    collectItem(acc, experiment)

    experiment.checkpoints?.forEach(checkpoint => {
      return collectItem(acc, checkpoint)
    })
  })

  return acc
}

const collectExperimentOnlyItems = (experiments: Experiment[]) => {
  const acc: QuickPickItemAccumulator = {
    items: [],
    selectedItems: []
  }

  experiments.forEach(experiment =>
    collectItem(acc, experiment, (experiment: Experiment) => ({
      ...getItem(experiment),
      description: experiment.displayNameOrParent
    }))
  )

  return acc
}

const collectItems = (
  experiments: ExperimentWithCheckpoints[],
  hasCheckpoints: boolean
): QuickPickItemAccumulator => {
  if (hasCheckpoints) {
    return collectCheckpointItems(experiments)
  }
  return collectExperimentOnlyItems(experiments)
}

export const pickExperiments = (
  experiments: ExperimentWithCheckpoints[],
  hasCheckpoints: boolean
): Promise<Experiment[] | undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError('There are no experiments to select.')
  }

  const { items, selectedItems } = collectItems(experiments, hasCheckpoints)

  return quickPickLimitedValues<Experiment | undefined>(
    items,
    selectedItems,
    MAX_SELECTED_EXPERIMENTS,
    Title.SELECT_EXPERIMENTS
  )
}
