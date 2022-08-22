export enum Command {
  ADD = 'add',
  CLEAN = 'clean',
  DIFF = 'diff',
  LS_FILES = 'ls-files',
  PUSH = 'push',
  RESET = 'reset',
  REV_PARSE = 'rev-parse'
}

export enum Flag {
  DIRECTORIES = '-d',
  DOT = '.',
  FORCE = '-f',
  HARD = '--hard',
  SHOW_TOPLEVEL = '--show-toplevel',
  QUIET = '-q'
}
