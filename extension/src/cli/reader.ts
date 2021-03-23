import { EXPERIMENT_SHOW } from './commands'
import { execPromise } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getPythonExecutionDetails } from '../util/pythonExtension'

interface ReaderOptions {
  cliPath: string
  cwd: string
}

const getDvcInvocation = async (options: ReaderOptions) => {
  const { cliPath } = options
  if (cliPath) return cliPath
  const executionDetails = await getPythonExecutionDetails()
  return executionDetails ? `${executionDetails.join(' ')} -m` : 'dvc'
}

const execCommand = async (
  options: ReaderOptions,
  command: string
): Promise<{ stdout: string; stderr: string }> => {
  const { cwd } = options
  const fullCommandString = `${await getDvcInvocation(options)} ${command}`
  return execPromise(fullCommandString, {
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
