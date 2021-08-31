const SEPARATOR = '/'
export const joinParamOrMetricPath = (...pathArray: string[]) =>
  pathArray.join(SEPARATOR)
export const splitParamOrMetricPath = (path: string) => path.split(SEPARATOR)
