export enum Commands {
  ADD = 'add',
  CHECKOUT = 'checkout',
  CHECKOUT_RECURSIVE = 'checkout --recursive',
  INITIALIZE_SUBDIRECTORY = 'init --subdir',
  PULL = 'pull',
  PUSH = 'push',
  STATUS = 'status --show-json',
  EXPERIMENT_RUN = 'exp run',
  EXPERIMENT_SHOW = 'exp show --show-json',
  EXPERIMENT_QUEUE = 'exp run --queue',
  EXPERIMENT_RUN_ALL = 'exp run --run-all',
  EXPERIMENT_GC = 'exp gc -f -w'
}

export enum GcPreserveFlag {
  ALL_BRANCHES = '--all-branches',
  ALL_TAGS = '--all-tags',
  ALL_COMMITS = '--all-commits',
  QUEUED = '--queued'
}

export const getCommandWithTarget = (
  command: Commands,
  target: string
): string => `${command} ${target}`
