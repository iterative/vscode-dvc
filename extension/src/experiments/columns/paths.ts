import { join } from 'path'
import {
  DECODE_METRIC_PARAM_REGEX,
  ENCODED_METRIC_PARAM_SEPARATOR,
  ENCODE_METRIC_PARAM_REGEX,
  FILE_SEPARATOR,
  FILE_SPLIT_REGEX,
  METRIC_PARAM_SEPARATOR
} from './constants'
import { definedAndNonEmpty } from '../../util/array'
import { ColumnType } from '../webview/contract'

const encodeColumn = (segment: string) =>
  segment.replace(ENCODE_METRIC_PARAM_REGEX, ENCODED_METRIC_PARAM_SEPARATOR)

const decodeColumn = (segment: string) =>
  segment.replace(DECODE_METRIC_PARAM_REGEX, METRIC_PARAM_SEPARATOR)

export const appendColumnToPath = (...pathSegments: string[]) => {
  const [fileSegment, ...rest] = pathSegments
  if (rest.length === 0) {
    return fileSegment
  }
  return (
    fileSegment +
    FILE_SEPARATOR +
    rest.map(encodeColumn).join(METRIC_PARAM_SEPARATOR)
  )
}

export const buildMetricOrParamPath = (
  type: ColumnType,
  ...pathSegments: string[]
): string => {
  const [fileSegment, ...rest] = pathSegments
  if (!fileSegment) {
    return type
  }
  if (rest.length === 0) {
    return type + FILE_SEPARATOR + fileSegment
  }

  return type + FILE_SEPARATOR + appendColumnToPath(fileSegment, ...rest)
}

export const buildDepPath = (...pathSegments: string[]) => {
  if (!definedAndNonEmpty(pathSegments)) {
    return ColumnType.DEPS
  }
  return buildMetricOrParamPath(ColumnType.DEPS, join(...pathSegments))
}

export const splitColumnPath = (path: string) => {
  const regexResult = FILE_SPLIT_REGEX.exec(path)
  if (!regexResult) {
    return []
  }
  const [, baseSegment, fileSegment, paramPath] = regexResult
  if (!fileSegment) {
    return [baseSegment]
  }
  const cleanFileSegment = fileSegment.replace(/_\d+$/g, '')
  if (!paramPath) {
    return [baseSegment, cleanFileSegment]
  }
  return [
    baseSegment,
    cleanFileSegment,
    ...paramPath.split(METRIC_PARAM_SEPARATOR).map(decodeColumn)
  ]
}
