import { Commands } from './commands'
import { execPromise } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getPythonExecutionDetails } from '../extensions/python'

interface ReaderOptions {
  cliPath?: string
  cwd: string
}

export const getDvcInvocation = async (options: ReaderOptions) => {
  const { cliPath } = options
  if (cliPath) {
    return cliPath
  }
  const executionDetails = await getPythonExecutionDetails()
  return executionDetails ? `${executionDetails.join(' ')} -m dvc` : 'dvc'
}

export const execCommand = async (
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
  const { stdout } = await execCommand(options, Commands.experiment_show)
  return JSON.parse(stdout)
}

export const initializeDirectory = async (
  options: ReaderOptions
): Promise<string> => {
  const { stdout } = await execCommand(
    options,
    Commands.initialize_subdirectory
  )
  return stdout
}

export const checkout = async (options: ReaderOptions): Promise<string> => {
  const { stdout } = await execCommand(options, Commands.checkout)
  return stdout
}

export const checkoutRecursive = async (
  options: ReaderOptions
): Promise<string> => {
  const { stdout } = await execCommand(options, Commands.checkout_recursive)
  return stdout
}

export const getRoot = async (options: ReaderOptions): Promise<string> => {
  const { stdout } = await execCommand(options, 'root')
  return stdout.trim()
}

export const listDvcOnlyRecursive = async (
  options: ReaderOptions
): Promise<string[]> => {
  const { stdout } = await execCommand(options, `list . --dvc-only -R`)
  return stdout.trim().split('\n')
}
