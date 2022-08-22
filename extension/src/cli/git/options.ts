import { Command, Commit, DEFAULT_REMOTE, Flag } from './constants'
import { ProcessOptions } from '../../processExecution'

export const getOptions = (
  cwd: string,
  ...args: (Command | Flag | Commit | typeof DEFAULT_REMOTE)[]
): ProcessOptions => ({
  args,
  cwd,
  executable: 'git'
})
