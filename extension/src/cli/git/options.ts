import { Args } from './constants'
import { ProcessOptions } from '../../processExecution'

export const getOptions = (cwd: string, ...args: Args): ProcessOptions => ({
  args,
  cwd,
  executable: 'git'
})
