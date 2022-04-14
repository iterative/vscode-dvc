import { MetricOrParamType } from '../webview/contract'

export const METRIC_PARAM_SEPARATOR = '.'
const ENCODED_METRIC_PARAM_SEPARATOR = '%2E'
const ENCODE_METRIC_PARAM_REGEX = /\./g
const DECODE_METRIC_PARAM_REGEX = /%2E/g

const FILE_SEPARATOR = ':'
const FILE_SPLIT_REGEX = new RegExp(
  `([^${FILE_SEPARATOR}]*)(?:${FILE_SEPARATOR}([^${FILE_SEPARATOR}]*))?(?:${FILE_SEPARATOR}(.*))?`
)

export const encodeMetricOrParam = (segment: string) =>
  segment.replace(ENCODE_METRIC_PARAM_REGEX, ENCODED_METRIC_PARAM_SEPARATOR)
export const decodeMetricOrParam = (segment: string) =>
  segment.replace(DECODE_METRIC_PARAM_REGEX, METRIC_PARAM_SEPARATOR)

export const appendMetricOrParamToPath = (...pathSegments: string[]) => {
  const [fileSegment, ...rest] = pathSegments
  if (rest.length === 0) {
    return fileSegment
  }
  return (
    fileSegment +
    FILE_SEPARATOR +
    rest.map(encodeMetricOrParam).join(METRIC_PARAM_SEPARATOR)
  )
}

export const joinMetricOrParamPath = (
  type: MetricOrParamType,
  ...pathSegments: string[]
) => {
  const [fileSegment, ...rest] = pathSegments
  if (!fileSegment) {
    return type
  }
  if (rest.length === 0) {
    return type + FILE_SEPARATOR + fileSegment
  }
  return type + FILE_SEPARATOR + appendMetricOrParamToPath(fileSegment, ...rest)
}

export const splitMetricOrParamPath = (path: string) => {
  const regexResult = FILE_SPLIT_REGEX.exec(path)
  if (!regexResult) {
    return []
  }
  const [, baseSegment, fileSegment, paramPath] = regexResult
  if (!fileSegment) {
    return [baseSegment]
  }
  if (!paramPath) {
    return [baseSegment, fileSegment]
  }
  return [
    baseSegment,
    fileSegment,
    ...paramPath.split(METRIC_PARAM_SEPARATOR).map(decodeMetricOrParam)
  ]
}
