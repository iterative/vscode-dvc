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
  CONFIG = 'config',
  DATA = 'data',
  EXPERIMENT = 'exp',
  INITIALIZE = 'init',
  MOVE = 'move',
  PLOTS = 'plots',
  PULL = 'pull',
  PUSH = 'push',
  QUEUE = 'queue',
  REMOVE = 'remove',
  REMOTE = 'remote',
  ROOT = 'root',
  PARAMS = 'params',
  METRICS = 'metrics',
  STAGE = 'stage'
}

export enum SubCommand {
  ADD = 'add',
  DIFF = 'diff',
  LIST = 'list',
  STATUS = 'status',
  SHOW = 'show'
}

export enum Flag {
  ALL_COMMITS = '-A',
  FOLLOW = '-f',
  DEFAULT = '-d',
  FORCE = '-f',
  GLOBAL = '--global',
  GRANULAR = '--granular',
  JOBS = '-j',
  JSON = '--json',
  KILL = '--kill',
  LOCAL = '--local',
  PROJECT = '--project',
  NUM_COMMIT = '-n',
  OUTPUT_PATH = '-o',
  SUBDIRECTORY = '--subdir',
  SET_PARAM = '-S',
  SPLIT = '--split',
  UNCHANGED = '--unchanged',
  UNSET = '--unset',
  VERSION = '--version'
}

export enum ExperimentSubCommand {
  APPLY = 'apply',
  BRANCH = 'branch',
  GARBAGE_COLLECT = 'gc',
  PUSH = 'push',
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
  NO_FETCH = '--no-fetch',
  QUEUE = '--queue',
  RESET = '--reset',
  NUM_COMMIT = '-n',
  REV = '--rev'
}

export enum GcPreserveFlag {
  ALL_BRANCHES = '--all-branches',
  ALL_TAGS = '--all-tags',
  ALL_COMMITS = '--all-commits',
  QUEUED = '--queued',
  WORKSPACE = '--workspace'
}

export enum ConfigKey {
  STUDIO_TOKEN = 'studio.token'
}

type Target = string

type Flags = Flag | ExperimentFlag | GcPreserveFlag

export type Args = (
  | Command
  | Target
  | ExperimentSubCommand
  | Flags
  | ConfigKey
)[]
