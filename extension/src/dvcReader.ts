import { EXPERIMENT_SHOW } from './dvcCommands'
import { execPromise } from './util'
import { ExperimentsRepoJSONOutput } from './webviews/experiments/contract'
interface ReaderOptions {
  cliPath: string
  cwd: string
}

const execCommand = (
  options: ReaderOptions,
  command: string
): Promise<{ stdout: string; stderr: string }> => {
  const { cliPath, cwd } = options

  return execPromise(`${cliPath} ${command}`, {
    cwd
  })
}

export const getExperiments: (
  options: ReaderOptions
) => Promise<ExperimentsRepoJSONOutput> = async options => {
  const { stdout } = await execCommand(options, EXPERIMENT_SHOW)
  return JSON.parse(stdout)
}
