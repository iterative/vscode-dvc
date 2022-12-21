import get from 'lodash.get'
import { formatDate } from '../../util/date'
import { formatNumber } from '../../util/number'
import { splitColumnPath } from '../columns/paths'
import { Experiment } from '../webview/contract'

type Value = undefined | null | [] | string | number

const isDate = (value: Value): boolean =>
  !!(typeof value === 'string' && Date.parse(value))

const getStringifiedValue = (value: Value): string => {
  if (Number.isNaN(value)) {
    return 'NaN'
  }

  if (isDate(value)) {
    return formatDate(value as string)
  }

  if (Array.isArray(value)) {
    return `[${value?.toString()}]`
  }

  if (value === undefined) {
    return '-'
  }

  if (typeof value === 'number') {
    return formatNumber(value)
  }

  return String(value)
}

const getDataFromColumnPath = (
  experiment: Experiment,
  columnPath: string
): {
  type: string
  value: string | number
  columnPath: string
  splitUpPath: string[]
  truncatedValue: string
} => {
  const splitUpPath = splitColumnPath(columnPath)
  const collectedVal = get(experiment, splitUpPath)
  const value = collectedVal?.value || collectedVal
  const [type] = splitUpPath

  return {
    columnPath: columnPath.slice(type.length + 1) || columnPath,
    splitUpPath,
    truncatedValue: getStringifiedValue(value),
    type,
    value: typeof value === 'number' ? value : getStringifiedValue(value)
  }
}

export const getDataFromColumnPaths = (
  experiment: Experiment,
  columnPaths: string[]
) => columnPaths.map(path => getDataFromColumnPath(experiment, path))
