import { join } from 'path'
import { GIT_LOGS_REFS, GIT_REFS } from '../../git'

export const EXPERIMENTS_GIT_REFS = join(GIT_REFS, 'exps')
export const EXPERIMENTS_GIT_LOGS_REFS = join(GIT_LOGS_REFS, 'exps')
export const EXPERIMENTS_GIT_REFS_EXEC = join(EXPERIMENTS_GIT_REFS, 'exec')
