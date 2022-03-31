import { join } from 'path'
import { Args } from './constants'
import { joinTruthyItems } from '../util/array'

export const getCommandString = (
  pythonBinPath: string | undefined,
  executable: string,
  ...args: Args
): string => {
  const prefix = pythonBinPath ? join(pythonBinPath, 'python') : undefined
  return `${joinTruthyItems([prefix, executable])} ${args.join(' ')}`
}
