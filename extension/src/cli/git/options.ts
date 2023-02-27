import { Args } from './constants'
import { ProcessOptions } from '../../process/execution'

export const getOptions = (cwd: string, ...args: Args): ProcessOptions => ({
  args,
  cwd,
  executable: 'git'
})
