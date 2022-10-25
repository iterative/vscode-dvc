import { join } from 'path'
import { gitPath } from '../../cli/git/constants'

export const EXPERIMENTS_GIT_REFS = join(gitPath.GIT_REFS, 'exps')
export const EXPERIMENTS_GIT_LOGS_REFS = join(gitPath.GIT_LOGS_REFS, 'exps')
export const EXPERIMENTS_GIT_REFS_EXEC = join(EXPERIMENTS_GIT_REFS, 'exec')
