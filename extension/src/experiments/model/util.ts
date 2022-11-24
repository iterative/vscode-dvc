import get from 'lodash.get'
import { formatDate } from '../../util/date'
import { splitColumnPath } from '../columns/paths'
import { Experiment } from '../webview/contract'

type Value = undefined | null | [] | string | number

const isDate = (value: Value): boolean =>
  !!(typeof value === 'string' && Date.parse(value))

const isLongNumber = (value: Value): boolean =>
  typeof value === 'number' && value.toString().length > 7

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

  if (isLongNumber(value)) {
    return (value as number).toPrecision(5)
  }

  return String(value)
}

export const getDataFromColumnPath = (
  experiment: Experiment,
  columnPath: string
): { splitUpPath: string[]; value: string | null } => {
  const splitUpPath = splitColumnPath(columnPath)
  const collectedVal = get(experiment, splitUpPath)
  const value = collectedVal?.value || collectedVal

  return {
    splitUpPath,
    value:
      columnPath === 'Created' && typeof value === 'undefined'
        ? null
        : getStringifiedValue(value)
  }
}
