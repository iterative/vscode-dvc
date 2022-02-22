import { SortDefinition } from '.'
import { definedAndNonEmpty } from '../../../util/array'
import { quickPickManyValues, quickPickValue } from '../../../vscode/quickPick'
import { Toast } from '../../../vscode/toast'
import { pickFromMetricsAndParams } from '../../metricsAndParams/quickPick'
import { MetricOrParam } from '../../webview/contract'

export const pickSortToAdd = async (metricsAndParams: MetricOrParam[]) => {
  const picked = await pickFromMetricsAndParams(metricsAndParams, {
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
    return Toast.showError('There are no sorts to remove.')
  }

  return quickPickManyValues<SortDefinition>(
    sorts.map(sort => ({
      description: sort.descending ? 'descending' : 'ascending',
      label: sort.path,
      value: sort
    })),
    {
      title: 'Select sort(s) to remove'
    }
  )
}
