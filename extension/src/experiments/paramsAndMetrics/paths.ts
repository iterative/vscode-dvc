const FILE_SEPARATOR = ':'
const PARAM_METRIC_SEPARATOR = '.'
const FILE_SPLIT_REGEX = new RegExp(
  `([^${FILE_SEPARATOR}]*)(?:${FILE_SEPARATOR}([^${FILE_SEPARATOR}]*))?(?:${FILE_SEPARATOR}(.*))?`
)

export const joinParamOrMetricFilePath = (...pathSegments: string[]) => {
  const [fileSegment, ...rest] = pathSegments
  if (rest.length === 0) {
    return fileSegment
  }
  return fileSegment + FILE_SEPARATOR + rest.join(PARAM_METRIC_SEPARATOR)
}

export const joinParamOrMetricPath = (...pathSegments: string[]) => {
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
    joinParamOrMetricFilePath(fileSegment, ...rest)
  )
}

export const splitParamOrMetricPath = (path: string) => {
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
  return [baseSegment, fileSegment, ...paramPath.split(PARAM_METRIC_SEPARATOR)]
}
