import { Commands, GcPreserveFlag } from './commands'
import { execPromise, trimAndSplit } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getPythonExecutionDetails } from '../extensions/python'
import { getExecutionDetails } from './shellExecution'
import { Config } from '../Config'

interface ReaderOptions {
  cliPath: string | undefined
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
): Promise<string> => {
  const { cwd } = options
  const fullCommandString = `${await getDvcInvocation(options)} ${command}`
  const { stdout } = await execPromise(fullCommandString, {
    cwd
  })
  return stdout
}

export const getExperiments = async (
  options: ReaderOptions
): Promise<ExperimentsRepoJSONOutput> =>
  JSON.parse(await execCommand(options, Commands.EXPERIMENT_SHOW))

export const initializeDirectory = async (
  options: ReaderOptions
): Promise<string> => execCommand(options, Commands.INITIALIZE_SUBDIRECTORY)

export const checkout = async (options: ReaderOptions): Promise<string> =>
  execCommand(options, Commands.CHECKOUT)

export const checkoutRecursive = async (
  options: ReaderOptions
): Promise<string> => execCommand(options, Commands.CHECKOUT_RECURSIVE)

export const getRoot = async (options: ReaderOptions): Promise<string> =>
  (await execCommand(options, 'root')).trim()

export const listDvcOnlyRecursive = async (
  options: ReaderOptions
): Promise<string[]> =>
  trimAndSplit(await execCommand(options, `list . --dvc-only -R`))

export const status = async (
  config: Config,
  cwd: string
): Promise<Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>> => {
  const executionDetails = getExecutionDetails(config, Commands.STATUS)
  const { stdout } = await execPromise(executionDetails.command, {
    cwd,
    env: executionDetails.env
  })
  return JSON.parse(stdout)
}

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> => execCommand(options, Commands.EXPERIMENT_QUEUE)

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  execCommand(options, [Commands.EXPERIMENT_GC, ...preserveFlags].join(' '))
