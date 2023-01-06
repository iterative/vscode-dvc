import { join } from 'path'

export const UNEXPECTED_ERROR_CODE = 255
export const DOT_DVC = '.dvc'

export const TEMP_PLOTS_DIR = join(DOT_DVC, 'tmp', 'plots')
export const DVCLIVE_ONLY_RUNNING_SIGNAL_FILE = join(
  DOT_DVC,
  'tmp',
  'exps',
  'run',
  'DVCLIVE_ONLY'
)

export const NUM_OF_COMMITS_TO_SHOW = '3'

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
  QUEUE = 'queue',
  REMOVE = 'remove',
  ROOT = 'root',
  PARAMS = 'params',
  METRICS = 'metrics'
}

export enum SubCommand {
  DIFF = 'diff',
  STATUS = 'status',
  SHOW = 'show'
}

export enum Flag {
  ALL_COMMITS = '-A',
  FORCE = '-f',
  GRANULAR = '--granular',
  JOBS = '-j',
  JSON = '--json',
  NUM_COMMIT = '-n',
  OUTPUT_PATH = '-o',
  SUBDIRECTORY = '--subdir',
  SET_PARAM = '-S',
  SPLIT = '--split',
  UNCHANGED = '--unchanged',
  VERSION = '--version'
}

export enum ExperimentSubCommand {
  APPLY = 'apply',
  BRANCH = 'branch',
  GARBAGE_COLLECT = 'gc',
  REMOVE = 'remove',
  RUN = 'run'
}

export enum QueueSubCommand {
  START = 'start',
  STOP = 'stop'
}

export enum ExperimentFlag {
  NO_FETCH = '--no-fetch',
  QUEUE = '--queue',
  RESET = '--reset'
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
