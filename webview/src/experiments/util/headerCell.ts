import { Experiment } from 'dvc/src/experiments/webview/contract'
import { HeaderGroup } from 'react-table'

export const getFirstColumnId = (
  headerCell: HeaderGroup<Experiment>
): string => {
  if (!headerCell.headers) {
    return headerCell.id
  }
  return getFirstColumnId(headerCell.headers[0])
}

export const getLastColumnId = (
  headerCell: HeaderGroup<Experiment>
): string => {
  if (!headerCell.headers) {
    return headerCell.id
  }
  return getLastColumnId(headerCell.headers[headerCell.headers.length - 1])
}
