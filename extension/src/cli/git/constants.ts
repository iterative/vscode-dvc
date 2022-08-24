import { join } from 'path'

export const DOT_GIT = '.git'
export const DOT_GIT_HEAD = join(DOT_GIT, 'HEAD')
export const DOT_GIT_INDEX = join(DOT_GIT, 'index')
export const GIT_REFS = join(DOT_GIT, 'refs')
export const GIT_LOGS_REFS = join(DOT_GIT, 'logs', 'refs')
export const HEADS_GIT_REFS = join(GIT_REFS, 'heads')

export enum Command {
  ADD = 'add',
  CLEAN = 'clean',
  COMMIT = 'commit',
  DIFF = 'diff',
  LS_FILES = 'ls-files',
  PUSH = 'push',
  RESET = 'reset',
  REV_PARSE = 'rev-parse'
}

export enum Flag {
  DIRECTORIES = '-d',
  DIRECTORY = '--directory',
  DOT = '.',
  EXCLUDE_STANDARD = '--exclude-standard',
  FORCE = '-f',
  HARD = '--hard',
  MESSAGE = '-m',
  NAME_ONLY = '--name-only',
  NO_EMPTY_DIRECTORY = '--no-empty-directory',
  OTHERS = '--others',
  QUIET = '-q',
  RAW_WITH_NUL = '-z',
  SET_UPSTREAM = '--set-upstream',
  SHOW_TOPLEVEL = '--show-toplevel'
}

export enum Commit {
  HEAD = 'HEAD'
}

export const DEFAULT_REMOTE = 'origin'

export type Args = (Command | Flag | Commit | typeof DEFAULT_REMOTE)[]
