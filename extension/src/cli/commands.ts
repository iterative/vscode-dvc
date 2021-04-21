export enum Commands {
  ADD = 'add',
  CHECKOUT = 'checkout',
  CHECKOUT_RECURSIVE = 'checkout --recursive',
  EXPERIMENT_GC = 'exp gc -f -w',
  EXPERIMENT_QUEUE = 'exp run --queue',
  EXPERIMENT_RUN = 'exp run',
  EXPERIMENT_RUN_ALL = 'exp run --run-all',
  EXPERIMENT_SHOW = 'exp show --show-json',
  EXPERIMENT_APPLY = 'exp apply',
  EXPERIMENT_BRANCH = 'exp branch',
  EXPERIMENT_REMOVE = 'exp remove',
  EXPERIMENT_LIST_NAMES_ONLY = 'exp list --names-only',
  INITIALIZE_SUBDIRECTORY = 'init --subdir',
  LIST_DVC_ONLY_RECURSIVE = 'list . --dvc-only -R',
  PULL = 'pull',
  PUSH = 'push',
  ROOT = 'root',
  STATUS = 'status --show-json'
}

export enum GcPreserveFlag {
  ALL_BRANCHES = '--all-branches',
  ALL_TAGS = '--all-tags',
  ALL_COMMITS = '--all-commits',
  QUEUED = '--queued'
}

export const addToCommand = (command: Commands, ...args: string[]): Commands =>
  [command, ...args].filter(Boolean).join(' ') as Commands
