import { join } from 'path'

export const gitPath = {
  DOT_GIT: '.git',
  DOT_GIT_HEAD: 'HEAD',
  DOT_GIT_INDEX: 'index',
  GIT_LOGS_REFS: join('logs', 'ref'),
  GIT_REFS: 'refs',
  HEADS_GIT_REFS: 'heads'
} as const

export enum Command {
  ADD = 'add',
  CLEAN = 'clean',
  COMMIT = 'commit',
  DIFF = 'diff',
  INITIALIZE = 'init',
  LOG = 'log',
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
  NUMBER = '-n',
  PRETTY_FORMAT_COMMIT_MESSAGE = '--pretty=format:%H%n%an%n%ar%nrefNames:%D%nmessage:%B',
  OTHERS = '--others',
  QUIET = '-q',
  RAW_WITH_NUL = '-z',
  SEPARATE_WITH_NULL = '-z',
  SET_UPSTREAM = '--set-upstream',
  SHOW_TOPLEVEL = '--show-toplevel'
}

export enum Commit {
  HEAD = 'HEAD'
}

export const DEFAULT_REMOTE = 'origin'

export const COMMITS_SEPARATOR = '\u0000'

export type Args = (Command | Flag | Commit | typeof DEFAULT_REMOTE | string)[]
