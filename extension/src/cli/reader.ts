import { Commands, GcPreserveFlag } from './commands'
import { execPromise, trimAndSplit } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getPythonExecutionDetails } from '../extensions/python'
import { getExecutionDetails } from './executionDetails'
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

interface ExecutionOptions {
  config: Config
  cwd: string
}

const executeProcess = async (
  options: ExecutionOptions,
  command: Commands
): Promise<string> => {
  const executionDetails = getExecutionDetails(options.config, command)
  const { stdout } = await execPromise(executionDetails.command, {
    cwd: options.cwd,
    env: executionDetails.env
  })
  return stdout
}

const executeWithTrimAndSplit = async (
  options: ExecutionOptions,
  command: Commands
): Promise<string[]> => {
  const stdout = await executeProcess(options, command)
  return trimAndSplit(stdout)
}

const executeAndParseJson = async <T>(
  options: ExecutionOptions,
  command: Commands
): Promise<T> => {
  const stdout = await executeProcess(options, command)
  return JSON.parse(stdout)
}

export const getExperiments = async (
  options: ExecutionOptions
): Promise<ExperimentsRepoJSONOutput> =>
  executeAndParseJson<ExperimentsRepoJSONOutput>(
    options,
    Commands.EXPERIMENT_SHOW
  )

export const listDvcOnlyRecursive = async (
  options: ExecutionOptions
): Promise<string[]> =>
  executeWithTrimAndSplit(options, Commands.LIST_DVC_ONLY_RECURSIVE)

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (options: ExecutionOptions): Promise<Status> =>
  executeAndParseJson<Status>(options, Commands.STATUS)

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> => execCommand(options, Commands.EXPERIMENT_QUEUE)

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  execCommand(options, [Commands.EXPERIMENT_GC, ...preserveFlags].join(' '))
