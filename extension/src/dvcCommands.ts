import { getDvcPath } from './DvcPath'

const getCliCommand = (command: string): string => {
  const dvcPath = getDvcPath()
  return `${dvcPath} ${command}`
}

const RUN_EXPERIMENT = 'exp run'

export const getRunExperimentCommand = (): string => {
  return getCliCommand(RUN_EXPERIMENT)
}
