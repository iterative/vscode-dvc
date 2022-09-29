import { join } from 'path'
import { definedAndNonEmpty } from '../../util/array'
import { ColumnType } from '../webview/contract'

export const METRIC_PARAM_SEPARATOR = '.'
const ENCODED_METRIC_PARAM_SEPARATOR = '%2E'
const ENCODE_METRIC_PARAM_REGEX = /\./g
const DECODE_METRIC_PARAM_REGEX = /%2E/g

export const FILE_SEPARATOR = ':'
const FILE_SPLIT_REGEX = new RegExp(
  `([^${FILE_SEPARATOR}]*)(?:${FILE_SEPARATOR}([^${FILE_SEPARATOR}]*))?(?:${FILE_SEPARATOR}(.*))?`
)

export const encodeColumn = (segment: string) =>
  segment.replace(ENCODE_METRIC_PARAM_REGEX, ENCODED_METRIC_PARAM_SEPARATOR)
export const decodeColumn = (segment: string) =>
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
