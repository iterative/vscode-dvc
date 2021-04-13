export enum Commands {
  ADD = 'add',
  CHECKOUT = 'checkout',
  CHECKOUT_RECURSIVE = 'checkout --recursive',
  EXPERIMENT_RUN = 'exp run',
  EXPERIMENT_SHOW = 'exp show --show-json',
  INITIALIZE_SUBDIRECTORY = 'init --subdir',
  PULL = 'pull',
  PUSH = 'push',
  STATUS = 'status --show-json',
  QUEUE_EXPERIMENT = 'exp run --queue',
  RUN_ALL_EXPERIMENTS = 'exp run --run-all'
}

export const getCommandWithTarget = (
  command: Commands,
  target: string
): string => `${command} ${target}`
