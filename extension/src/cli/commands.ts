export enum Commands {
  experiment_run = 'exp run',
  experiment_show = 'exp show --show-json',
  initialize_subdirectory = 'init --subdir',
  add = 'add',
  checkout = 'checkout',
  checkout_recursive = 'checkout --recursive',
  root = 'root'
}

const getCliCommand = (command: string, ...options: string[]): string => {
  return `dvc ${command} ${options.join(' ')}`
}

export const getRunExperimentCommand = (): string => {
  return getCliCommand(Commands.experiment_run)
}
