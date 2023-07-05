import { ColumnType } from '../webview/contract'

export type SummaryAcc = {
  metrics: string[]
  params: string[]
}

export const collectFromColumnOrder = (path: string, acc: SummaryAcc) => {
  if (path.startsWith(ColumnType.METRICS)) {
    acc.metrics.push(path)
  } else if (path.startsWith(ColumnType.PARAMS)) {
    acc.params.push(path)
  }
}
