export const MIN_CLI_VERSION = '2.15.0'
export const LATEST_TESTED_CLI_VERSION = '2.15.0'
export const MAX_CLI_VERSION = '3'

export enum Command {
  ADD = 'add',
  CHECKOUT = 'checkout',
  COMMIT = 'commit',
  DATA = 'data',
  EXPERIMENT = 'exp',
  INITIALIZE = 'init',
  MOVE = 'move',
  PLOTS = 'plots',
  PULL = 'pull',
  PUSH = 'push',
  REMOVE = 'remove',
  ROOT = 'root',
  PARAMS = 'params',
  METRICS = 'metrics'
}

export enum SubCommand {
  STATUS = 'status',
  SHOW = 'show'
}

export enum Flag {
  FORCE = '-f',
  GRANULAR = '--granular',
  OUTPUT_PATH = '-o',
  SHOW_JSON = '--show-json',
  SUBDIRECTORY = '--subdir',
  SET_PARAM = '-S',
  SPLIT = '--split',
  UNCHANGED = '--unchanged',
  VERSION = '--version',
  WITH_DIRS = '--with-dirs'
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

type Target = string

type Flags = Flag | ExperimentFlag | GcPreserveFlag

export type Args = (Command | Target | ExperimentSubCommand | Flags)[]
