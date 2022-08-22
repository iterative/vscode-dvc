import { executeProcess } from './processExecution'

export const getGitRepositoryRoot = (cwd: string): Promise<string> =>
  executeProcess({
    args: ['rev-parse', '--show-toplevel'],
    cwd,
    executable: 'git'
  })
