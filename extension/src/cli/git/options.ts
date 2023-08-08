import { Args } from './constants'
import { ProcessOptions } from '../../process/execution'

export const getOptions = ({
  cwd,
  args = [],
  env
}: {
  cwd: string
  args?: Args
  env?: NodeJS.ProcessEnv
}): ProcessOptions => {
  const options: ProcessOptions = {
    args,
    cwd,
    executable: 'git'
  }

  if (env) {
    options.env = { ...env, GIT_OPTIONAL_LOCKS: '0' }
  }

  return options
}
