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
  summaryColumnOrder: string[]
): QuickPickItemWithValue<Experiment | undefined> => ({
  detail: getColumnPathsQuickPickDetail(experiment, summaryColumnOrder),
  label: experiment.label,
  value: experiment
})

const getItemWithDescription = (
  experiment: Experiment,
  summaryColumnOrder: string[]
) => {
  const item = getItem(experiment, summaryColumnOrder)
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
  summaryColumnOrder: string[],
  transformer = getItem
) => {
  const item = transformer(experiment, summaryColumnOrder)
  acc.items.push(item)
  if (experiment.selected) {
    acc.selectedItems.push(item)
  }
  return acc
}

const collectItems = (
  experiments: Experiment[],
  summaryColumnOrder: string[]
) => {
  const acc: QuickPickItemAccumulator = {
    items: [],
    selectedItems: []
  }

  for (const experiment of experiments) {
    collectItem(acc, experiment, summaryColumnOrder, getItemWithDescription)
  }

  return acc
}

export const pickExperimentsToPlot = (
  experiments: Experiment[],
  summaryColumnOrder: string[]
): Promise<Experiment[] | undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError(noExperimentsToSelect)
  }

  const { items, selectedItems } = collectItems(experiments, summaryColumnOrder)

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
  summaryColumnOrder: string[]
): ExperimentItem[] =>
  experiments.map(experiment => {
    const { label, id, description, commit } = experiment
    return {
      description:
        description && `${commit ? '$(git-commit)' : ''}${description}`,
      detail: getColumnPathsQuickPickDetail(experiment, summaryColumnOrder),
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
  summaryColumnOrder: string[],
  title: Title,
  quickPick: T
): ReturnType<T> | Promise<undefined> => {
  if (!definedAndNonEmpty(experiments)) {
    return Toast.showError(noExperimentsToSelect)
  }

  const items = getExperimentItems(experiments, summaryColumnOrder)

  return quickPick(items, {
    matchOnDescription: true,
    matchOnDetail: true,
    title
  }) as ReturnType<T>
}

export const pickExperiment = (
  experiments: Experiment[],
  summaryColumnOrder: string[],
  title: Title = Title.SELECT_EXPERIMENT
): Thenable<string | undefined> =>
  pickExperimentOrExperiments<QuickPickExperiment>(
    experiments,
    summaryColumnOrder,
    title,
    quickPickValue
  )

export const pickExperiments = (
  experiments: Experiment[],
  summaryColumnOrder: string[],
  title: Title = Title.SELECT_EXPERIMENTS
): Thenable<string[] | undefined> =>
  pickExperimentOrExperiments<QuickPickExperiments>(
    experiments,
    summaryColumnOrder,
    title,
    quickPickManyValues
  )
