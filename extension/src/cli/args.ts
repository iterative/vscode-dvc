export enum Command {
  ADD = 'add',
  CHECKOUT = 'checkout',
  COMMIT = 'commit',
  DIFF = 'diff',
  EXPERIMENT = 'exp',
  INITIALIZE = 'init',
  LIST = 'list',
  PULL = 'pull',
  PUSH = 'push',
  REMOVE = 'remove',
  ROOT = 'root',
  STATUS = 'status'
}

export enum Flag {
  FORCE = '-f',
  HELP = '-h',
  RECURSIVE = '-R',
  SHOW_JSON = '--show-json',
  SUBDIRECTORY = '--subdir'
}

export enum ExperimentSubCommand {
  APPLY = 'apply',
  BRANCH = 'branch',
  GARBAGE_COLLECT = 'gc',
  LIST = 'list',
  SHOW = 'show',
  REMOVE = 'remove',
  RUN = 'run'
}

export enum ExperimentFlag {
  NAMES_ONLY = '--names-only',
  QUEUE = '--queue',
  RESET = '--reset',
  RUN_ALL = '--run-all',
  WORKSPACE = '-w'
}

export enum GcPreserveFlag {
  ALL_BRANCHES = '--all-branches',
  ALL_TAGS = '--all-tags',
  ALL_COMMITS = '--all-commits',
  QUEUED = '--queued'
}

export enum ListFlag {
  LOCAL_REPO = '.',
  DVC_ONLY = '--dvc-only'
}

type Target = string

type Flags = Flag | ExperimentFlag | ListFlag | GcPreserveFlag

export type Args = (Command | Target | ExperimentSubCommand | Flags)[]
