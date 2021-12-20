const FILE_SEPARATOR = ':'
const METRIC_PARAM_SEPARATOR = '.'
const FILE_SPLIT_REGEX = new RegExp(
  `([^${FILE_SEPARATOR}]*)(?:${FILE_SEPARATOR}([^${FILE_SEPARATOR}]*))?(?:${FILE_SEPARATOR}(.*))?`
)

export const joinMetricOrParamFilePath = (...pathSegments: string[]) => {
  const [fileSegment, ...rest] = pathSegments
  if (rest.length === 0) {
    return fileSegment
  }
  return fileSegment + FILE_SEPARATOR + rest.join(METRIC_PARAM_SEPARATOR)
}

export const joinMetricOrParamPath = (...pathSegments: string[]) => {
  const [baseSegment, fileSegment, ...rest] = pathSegments
  if (!fileSegment) {
    return baseSegment
  }
  if (rest.length === 0) {
    return baseSegment + FILE_SEPARATOR + fileSegment
  }
  return (
    baseSegment +
    FILE_SEPARATOR +
    joinMetricOrParamFilePath(fileSegment, ...rest)
  )
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
  return [baseSegment, fileSegment, ...paramPath.split(METRIC_PARAM_SEPARATOR)]
}
