import { delimiter } from 'path'
import { joinTruthyItems } from './array'
export const joinEnvPath = (...pathArray: string[]) =>
  joinTruthyItems(pathArray, delimiter)
