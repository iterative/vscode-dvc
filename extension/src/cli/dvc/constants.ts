import { join } from 'path'

export const UNEXPECTED_ERROR_CODE = 255
export const DOT_DVC = '.dvc'

export const TEMP_PLOTS_DIR = join(DOT_DVC, 'tmp', 'plots')

const TEMP_EXP_DIR = join(DOT_DVC, 'tmp', 'exps')
export const DVCLIVE_ONLY_RUNNING_SIGNAL_FILE = join(
  TEMP_EXP_DIR,
  'run',
  'DVCLIVE_ONLY'
)
export const EXP_RWLOCK_FILE = join(TEMP_EXP_DIR, 'rwlock.lock')

export const DEFAULT_NUM_OF_COMMITS_TO_SHOW = 3
export const NUM_OF_COMMITS_TO_INCREASE = 2

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
  METRICS = 'metrics',
  STAGE = 'stage'
}

export enum SubCommand {
  DIFF = 'diff',
  LIST = 'list',
  STATUS = 'status',
  SHOW = 'show'
}

export enum Flag {
  ALL_COMMITS = '-A',
  FOLLOW = '-f',
  FORCE = '-f',
  GRANULAR = '--granular',
  JOBS = '-j',
  JSON = '--json',
  KILL = '--kill',
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
  KILL = 'kill',
  LOGS = 'logs',
  START = 'start',
  STOP = 'stop'
}

export enum ExperimentFlag {
  ALL_BRANCHES = '-a',
  NO_FETCH = '--no-fetch',
  QUEUE = '--queue',
  RESET = '--reset',
  NUM_COMMIT = '-n'
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
