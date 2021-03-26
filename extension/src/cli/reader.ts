import { Commands } from './commands'
import { execPromise } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'

interface ReaderOptions {
  cliPath: string
  cwd: string
}

export const execCommand = (
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
