import { join } from 'path'

export const DOT_GIT = '.git'
export const DOT_GIT_HEAD = join(DOT_GIT, 'HEAD')
export const DOT_GIT_INDEX = join(DOT_GIT, 'index')
export const GIT_REFS = join(DOT_GIT, 'refs')
export const EXPERIMENTS_GIT_REFS = join(GIT_REFS, 'exps')
export const HEADS_GIT_REFS = join(GIT_REFS, 'heads')
