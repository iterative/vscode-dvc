import { window } from 'vscode'
import { SortDefinition } from '.'
import { definedAndNonEmpty } from '../../../util/array'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'
import { pickFromParamsAndMetrics } from '../../paramsAndMetrics/quickPick'
import { ParamOrMetric } from '../../webview/contract'

export const pickSortToAdd = async (paramsAndMetrics: ParamOrMetric[]) => {
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

export const pickSortsToRemove = (
  sorts: SortDefinition[]
): Thenable<SortDefinition[] | undefined> => {
  if (!definedAndNonEmpty(sorts)) {
    window.showErrorMessage('There are no sorts to remove.')
    return Promise.resolve(undefined)
  }

  return quickPickManyValues<SortDefinition>(
    sorts.map(sort => ({
      description: sort.path,
      label: sort.descending ? 'descending' : 'ascending',
      value: sort
    })),
    {
      title: 'Select sort(s) to remove'
    }
  )
}
