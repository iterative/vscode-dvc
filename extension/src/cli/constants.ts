export const MIN_CLI_VERSION = '2.6.5'
export const MAX_CLI_VERSION = '3'

export enum Command {
  ADD = 'add',
  CHECKOUT = 'checkout',
  COMMIT = 'commit',
  DIFF = 'diff',
  EXPERIMENT = 'exp',
  INITIALIZE = 'init',
  LIST = 'list',
  MOVE = 'move',
  PLOTS = 'plots',
  PULL = 'pull',
  PUSH = 'push',
  REMOVE = 'remove',
  ROOT = 'root',
  STATUS = 'status',
  PARAMS = 'params',
  METRICS = 'metrics'
}

export enum SubCommand {
  SHOW = 'show'
}

export enum Flag {
  FORCE = '-f',
  OUTPUT_PATH = '-o',
  RECURSIVE = '-R',
  SHOW_JSON = '--show-json',
  SUBDIRECTORY = '--subdir',
  SET_PARAM = '-S',
  SPLIT = '--split',
  VERSION = '--version'
}

export enum ExperimentSubCommand {
  APPLY = 'apply',
  BRANCH = 'branch',
  GARBAGE_COLLECT = 'gc',
  REMOVE = 'remove',
  RUN = 'run'
}

export enum ExperimentFlag {
  NO_FETCH = '--no-fetch',
  QUEUE = '--queue',
  RESET = '--reset',
  RUN_ALL = '--run-all'
}

export enum GcPreserveFlag {
  ALL_BRANCHES = '--all-branches',
  ALL_TAGS = '--all-tags',
  ALL_COMMITS = '--all-commits',
  QUEUED = '--queued',
  WORKSPACE = '--workspace'
}

export enum ListFlag {
  LOCAL_REPO = '.',
  DVC_ONLY = '--dvc-only'
}

type Target = string

type Flags = Flag | ExperimentFlag | ListFlag | GcPreserveFlag

export type Args = (Command | Target | ExperimentSubCommand | Flags)[]
