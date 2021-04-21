export enum Commands {
  ADD = 'add',
  CHECKOUT = 'checkout',
  CHECKOUT_RECURSIVE = 'checkout --recursive',
  EXPERIMENT_GC = 'exp gc -f -w',
  EXPERIMENT_QUEUE = 'exp run --queue',
  EXPERIMENT_RUN = 'exp run',
  EXPERIMENT_RUN_ALL = 'exp run --run-all',
  EXPERIMENT_SHOW = 'exp show --show-json',
  INITIALIZE_SUBDIRECTORY = 'init --subdir',
  LIST = 'list .',
  LIST_DVC_ONLY_RECURSIVE = 'list . --dvc-only -R',
  PULL = 'pull',
  PUSH = 'push',
  ROOT = 'root',
  STATUS = 'status --show-json'
}

export enum ListFlag {
  DVC_ONLY = '--dvc-only'
}

export const getListCommand = (relativePath: string): Commands =>
  [Commands.LIST, relativePath, ListFlag.DVC_ONLY].join(' ') as Commands

export enum GcPreserveFlag {
  ALL_BRANCHES = '--all-branches',
  ALL_TAGS = '--all-tags',
  ALL_COMMITS = '--all-commits',
  QUEUED = '--queued'
}

export const getCommandWithTarget = (
  command: Commands,
  target: string
): Commands => `${command} ${target}` as Commands
