import { SortDefinition } from '.'
import { quickPickValue } from '../../../vscode/quickPick'
import { pickFromParamsAndMetrics } from '../../paramsAndMetrics/quickPick'
import { ParamOrMetric } from '../../webview/contract'

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
