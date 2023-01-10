import { QuickPickItemKind } from 'vscode'
import omit from 'lodash.omit'
import { ExperimentWithCheckpoints } from '.'
import { MAX_SELECTED_EXPERIMENTS } from './status'
import { getColumnPathsQuickPickDetail } from './util'
import { definedAndNonEmpty } from '../../util/array'
import {
  QuickPickItemWithValue,
  quickPickLimitedValues,
  quickPickManyValues,
  quickPickValue
} from '../../vscode/quickPick'
import { Toast } from '../../vscode/toast'
import { Experiment } from '../webview/contract'
import { Title } from '../../vscode/title'

const noExperimentsToSelect = 'There are no experiments to select.'

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
  detail: getColumnPathsQuickPickDetail(experiment, firstThreeColumnOrder),
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

export const pickExperimentsToPlot = (
  experiments: ExperimentWithCheckpoints[],
  hasCheckpoints: boolean,
  firstThreeColumnOrder: string[]
): Promise<Experiment[] | undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError(noExperimentsToSelect)
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
    Title.SELECT_EXPERIMENTS_TO_PLOT,
    { matchOnDescription: true, matchOnDetail: true }
  )
}

export type ExperimentWithName = Experiment & {
  name?: string
}

type ExperimentItem = {
  description: string | undefined
  detail: string
  label: string
  value: { id: string; name: string }
}

const getExperimentItems = (
  experiments: ExperimentWithName[],
  firstThreeColumnOrder: string[]
): ExperimentItem[] =>
  experiments.map(experiment => {
    const { label, id, name, displayNameOrParent } = experiment
    return {
      description: displayNameOrParent,
      detail: getColumnPathsQuickPickDetail(experiment, firstThreeColumnOrder),
      label,
      value: {
        id,
        name: name || label
      }
    }
  })

const getQuickPickDetails = (
  experiments: ExperimentWithName[],
  firstThreeColumnOrder: string[],
  title: Title
): [
  ExperimentItem[],
  { matchOnDescription: boolean; matchOnDetail: boolean; title: Title }
] => [
  getExperimentItems(experiments, firstThreeColumnOrder),
  { matchOnDescription: true, matchOnDetail: true, title }
]

export const pickExperiment = (
  experiments: ExperimentWithName[],
  firstThreeColumnOrder: string[],
  title: Title = Title.SELECT_EXPERIMENT
): Thenable<{ id: string; name: string } | undefined> | undefined => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError(noExperimentsToSelect)
  }

  return quickPickValue<{ id: string; name: string }>(
    ...getQuickPickDetails(experiments, firstThreeColumnOrder, title)
  )
}

export const pickExperiments = (
  experiments: ExperimentWithName[],
  firstThreeColumnOrder: string[],
  title: Title = Title.SELECT_EXPERIMENTS
): Thenable<{ id: string; name: string }[] | undefined> | undefined => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError(noExperimentsToSelect)
  }
  return quickPickManyValues<{ id: string; name: string }>(
    ...getQuickPickDetails(experiments, firstThreeColumnOrder, title)
  )
}
