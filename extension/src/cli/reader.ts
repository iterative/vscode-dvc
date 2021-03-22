import { EXPERIMENT_SHOW } from './commands'
import { execPromise } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
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

export const getExperiments = async (
  options: ReaderOptions
): Promise<ExperimentsRepoJSONOutput> => {
  const { stdout } = await execCommand(options, EXPERIMENT_SHOW)
  return JSON.parse(stdout)
}

export const getRoot = async (options: ReaderOptions): Promise<string> => {
  const { stdout } = await execCommand(options, 'root')
  return stdout.trim()
}
