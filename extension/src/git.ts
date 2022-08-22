import { join } from 'path'
import { executeProcess } from './processExecution'

export const DOT_GIT = '.git'
export const DOT_GIT_HEAD = join(DOT_GIT, 'HEAD')
export const DOT_GIT_INDEX = join(DOT_GIT, 'index')
export const GIT_REFS = join(DOT_GIT, 'refs')
export const GIT_LOGS_REFS = join(DOT_GIT, 'logs', 'refs')
export const HEADS_GIT_REFS = join(GIT_REFS, 'heads')

export const getGitRepositoryRoot = (cwd: string): Promise<string> =>
  executeProcess({
    args: ['rev-parse', '--show-toplevel'],
    cwd,
    executable: 'git'
  })
