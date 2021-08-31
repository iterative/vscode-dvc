import { delimiter } from 'path'
import { joinTruthyItems } from './array'
const SEPARATOR = '/'
export const joinParamOrMetricPath = (...pathArray: string[]) =>
  pathArray.join(SEPARATOR)
export const splitParamOrMetricPath = (path: string) => path.split(SEPARATOR)
export const joinEnvPath = (...pathArray: string[]) =>
  joinTruthyItems(pathArray, delimiter)
