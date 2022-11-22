import get from 'lodash.get'
import { formatDate } from '../../util/date'
import { truncate } from '../../util/string'
import { splitColumnPath } from '../columns/paths'
import { Experiment } from '../webview/contract'

type Value = undefined | null | [] | string | number

const getValueType = (value: Value): string => {
  let type: string = typeof value
  if (Number.isNaN(value)) {
    type = 'NaN'
  } else if (typeof value === 'string' && Date.parse(value)) {
    type = 'date'
  } else if (Array.isArray(value)) {
    type = 'array'
  } else if (value === '') {
    type = 'empty'
  }
  return type
}

const getStringifiedValue = (value: Value): string => {
  const type = getValueType(value)
  switch (type) {
    case 'date':
      return typeof value === 'string' ? formatDate(value) : ''
    case 'array':
      return `[${value?.toString()}]`
    case 'empty':
    case 'NaN':
      return type
    case 'number':
      return truncate(String(value), 7)
    default:
      return String(value)
  }
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
