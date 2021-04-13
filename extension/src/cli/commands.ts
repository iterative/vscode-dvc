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
  QUEUE_EXPERIMENT = 'exp run --queue'
}

const getCliCommand = (command: string, ...options: string[]): string => {
  return `dvc ${command} ${options.join(' ')}`
}

export const getRunExperimentCommand = (): string => {
  return getCliCommand(Commands.EXPERIMENT_RUN)
}

export const getCommandWithTarget = (
  command: Commands,
  target: string
): string => `${command} ${target}`
