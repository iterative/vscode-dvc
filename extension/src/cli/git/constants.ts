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
  BRANCH = 'branch',
  CLEAN = 'clean',
  DIFF = 'diff',
  INITIALIZE = 'init',
  LOG = 'log',
  LS_FILES = 'ls-files',
  LS_REMOTE = 'ls-remote',
  RESET = 'reset',
  REV_PARSE = 'rev-parse',
  REV_LIST = 'rev-list'
}

export enum Flag {
  ALL = '--all',
  COUNT = '--count',
  DIRECTORIES = '-d',
  DIRECTORY = '--directory',
  DOT = '.',
  EXCLUDE_STANDARD = '--exclude-standard',
  FORCE = '-f',
  GET_URL = '--get-url',
  HARD = '--hard',
  NAME_ONLY = '--name-only',
  NO_EMPTY_DIRECTORY = '--no-empty-directory',
  NO_MERGE = '--no-merge',
  NUMBER = '-n',
  PRETTY_FORMAT_COMMIT_MESSAGE = '--pretty=format:%H%n%an%n%ar%nrefNames:%D%nmessage:%B',
  OTHERS = '--others',
  QUIET = '-q',
  RAW_WITH_NUL = '-z',
  SEPARATE_WITH_NULL = '-z',
  SHOW_TOPLEVEL = '--show-toplevel'
}

export enum Commit {
  HEAD = 'HEAD'
}

export const DEFAULT_REMOTE = 'origin'

export const COMMITS_SEPARATOR = '\u0000'

export type Args = (Command | Flag | Commit | typeof DEFAULT_REMOTE | string)[]
