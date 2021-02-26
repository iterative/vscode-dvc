const getCliCommand = (command: string): string => {
  return `dvc ${command}`
}

const RUN_EXPERIMENT = 'exp run'

export const getRunExperimentCommand = (): string => {
  return getCliCommand(RUN_EXPERIMENT)
}
