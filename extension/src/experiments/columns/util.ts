import { ColumnType } from '../webview/contract'

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
