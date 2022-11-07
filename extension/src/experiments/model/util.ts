import get from 'lodash.get'
import { formatDate } from '../../util/date'
import { splitColumnPath } from '../columns/paths'
import { Experiment } from '../webview/contract'

export const getDataFromColumnPath = (
  experiment: Experiment,
  columnPath: string
): { splitUpPath: string[]; value: string | null } => {
  const splitUpPath = splitColumnPath(columnPath)
  const collectedVal = get(experiment, splitUpPath)
  const value =
    columnPath === 'Created' && collectedVal
      ? formatDate(collectedVal)
      : collectedVal?.value || collectedVal

  return {
    splitUpPath,
    value: value === 0 || value ? value : null
  }
}
