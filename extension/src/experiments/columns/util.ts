import get from 'lodash.get'
import { ColumnType, Experiment } from '../webview/contract'

export const MAX_SUMMARY_ORDER_LENGTH = 3

export type SummaryAcc = {
  metrics: string[]
  params: string[]
}

export const collectFromColumnOrder = (path: string, acc: SummaryAcc) => {
  if (
    path.startsWith(ColumnType.METRICS) &&
    acc.metrics.length < MAX_SUMMARY_ORDER_LENGTH
  ) {
    acc.metrics.push(path)
    return
  }
  if (
    path.startsWith(ColumnType.PARAMS) &&
    acc.params.length < MAX_SUMMARY_ORDER_LENGTH
  ) {
    acc.params.push(path)
  }
}

export const limitSummaryOrder = (acc: SummaryAcc): string[] => [
  ...acc.params.slice(0, MAX_SUMMARY_ORDER_LENGTH),
  ...acc.metrics.slice(0, MAX_SUMMARY_ORDER_LENGTH)
]

export const getValue = (experiment: Experiment, pathArray: string[]) => {
  const copy = [...pathArray]
  if (pathArray[0] === String(ColumnType.DEPS)) {
    copy.push('value')
  }
  return get(experiment, copy) as string | number | boolean
}
