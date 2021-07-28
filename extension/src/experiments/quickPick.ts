import { QuickPickOptions, window } from 'vscode'
import { ParamOrMetric } from './webview/contract'
import { SortDefinition } from './model/sorting'
import { GcPreserveFlag } from '../cli/args'
import { quickPickManyValues, quickPickValue } from '../vscode/quickPick'

export const pickExperimentName = async (
  experimentNamesPromise: Promise<string[]>
): Promise<string | undefined> => {
  const experimentNames = await experimentNamesPromise
  if (experimentNames.length === 0) {
    window.showErrorMessage('There are no experiments to select.')
  } else {
    return window.showQuickPick(experimentNames)
  }
}

export const pickGarbageCollectionFlags = () =>
  quickPickManyValues<GcPreserveFlag>(
    [
      {
        detail: 'Preserve Experiments derived from all Git branches',
        label: 'All Branches',
        value: GcPreserveFlag.ALL_BRANCHES
      },
      {
        detail: 'Preserve Experiments derived from all Git tags',
        label: 'All Tags',
        value: GcPreserveFlag.ALL_TAGS
      },
      {
        detail: 'Preserve Experiments derived from all Git commits',
        label: 'All Commits',
        value: GcPreserveFlag.ALL_COMMITS
      },
      {
        detail: 'Preserve all queued Experiments',
        label: 'Queued Experiments',
        value: GcPreserveFlag.QUEUED
      }
    ],
    { placeHolder: 'Select which Experiments to preserve' }
  )

export const pickFromParamsAndMetrics = (
  paramsAndMetrics: ParamOrMetric[] | undefined,
  quickPickOptions: QuickPickOptions
) => {
  if (!paramsAndMetrics || paramsAndMetrics.length === 0) {
    window.showErrorMessage('There are no params or metrics to select from')
    return
  }
  return quickPickValue<ParamOrMetric>(
    paramsAndMetrics.map(paramOrMetric => ({
      description: paramOrMetric.path,
      label: paramOrMetric.name,
      value: paramOrMetric
    })),
    quickPickOptions
  )
}

export const pickSort = async (
  paramsAndMetrics: ParamOrMetric[] | undefined
): Promise<SortDefinition | undefined> => {
  const picked = await pickFromParamsAndMetrics(paramsAndMetrics, {
    title: 'Select a param or metric to sort by'
  })
  if (picked === undefined) {
    return
  }
  const descending = await quickPickValue<boolean>(
    [
      { label: 'Ascending', value: false },
      { label: 'Descending', value: true }
    ],
    { title: 'Select a direction to sort in' }
  )
  if (descending === undefined) {
    return
  }
  return {
    descending,
    path: picked.path
  }
}
