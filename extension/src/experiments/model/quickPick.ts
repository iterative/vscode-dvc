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

const getItem = (
  experiment: Experiment,
  firstThreeColumnOrder: string[]
): QuickPickItemWithValue<Experiment | undefined> => ({
  detail: getColumnPathsQuickPickDetail(experiment, firstThreeColumnOrder),
  label: experiment.label,
  value: experiment
})

const getItemWithDescription = (
  experiment: Experiment,
  firstThreeColumnOrder: string[]
) => {
  const item = getItem(experiment, firstThreeColumnOrder)
  if (experiment.description) {
    item.description = `${experiment.commit ? '$(git-commit)' : ''}${
      experiment.description
    }`
  }
  return item
}

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

const collectItems = (
  experiments: Experiment[],
  firstThreeColumnOrder: string[]
) => {
  const acc: QuickPickItemAccumulator = {
    items: [],
    selectedItems: []
  }

  for (const experiment of experiments) {
    collectItem(acc, experiment, firstThreeColumnOrder, getItemWithDescription)
  }

  return acc
}

export const pickExperimentsToPlot = (
  experiments: Experiment[],
  firstThreeColumnOrder: string[]
): Promise<Experiment[] | undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError(noExperimentsToSelect)
  }

  const { items, selectedItems } = collectItems(
    experiments,
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

type ExperimentItem = {
  description: string | undefined
  detail: string
  label: string
  value: string
}

const getExperimentItems = (
  experiments: Experiment[],
  firstThreeColumnOrder: string[]
): ExperimentItem[] =>
  experiments.map(experiment => {
    const { label, id, description, commit } = experiment
    return {
      description:
        description && `${commit ? '$(git-commit)' : ''}${description}`,
      detail: getColumnPathsQuickPickDetail(experiment, firstThreeColumnOrder),
      label,
      value: id
    }
  })

type QuickPickExperiment = typeof quickPickValue<string>
type QuickPickExperiments = typeof quickPickManyValues<string>

const pickExperimentOrExperiments = <
  T extends QuickPickExperiment | QuickPickExperiments
>(
  experiments: Experiment[],
  firstThreeColumnOrder: string[],
  title: Title,
  quickPick: T
): ReturnType<T> | Promise<undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError(noExperimentsToSelect)
  }

  const items = getExperimentItems(experiments, firstThreeColumnOrder)

  return quickPick(items, {
    matchOnDescription: true,
    matchOnDetail: true,
    title
  }) as ReturnType<T>
}

export const pickExperiment = (
  experiments: Experiment[],
  firstThreeColumnOrder: string[],
  title: Title = Title.SELECT_EXPERIMENT
): Thenable<string | undefined> =>
  pickExperimentOrExperiments<QuickPickExperiment>(
    experiments,
    firstThreeColumnOrder,
    title,
    quickPickValue
  )

export const pickExperiments = (
  experiments: Experiment[],
  firstThreeColumnOrder: string[],
  title: Title = Title.SELECT_EXPERIMENTS
): Thenable<string[] | undefined> =>
  pickExperimentOrExperiments<QuickPickExperiments>(
    experiments,
    firstThreeColumnOrder,
    title,
    quickPickManyValues
  )
