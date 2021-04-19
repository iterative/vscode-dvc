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

interface ExecutionOptions {
  config: Config
  cwd: string
}

const executeProcess = async (
  executionOptions: ExecutionOptions,
  command: Commands
): Promise<string> => {
  const executionDetails = getExecutionDetails(executionOptions.config, command)
  const { stdout } = await execPromise(executionDetails.command, {
    cwd: executionOptions.cwd,
    env: executionDetails.env
  })
  return stdout
}

const executeWithTrimAndSplit = async (
  executionOptions: ExecutionOptions,
  command: Commands
): Promise<string[]> => {
  const stdout = await executeProcess(executionOptions, command)
  return trimAndSplit(stdout)
}

const executeAndParseJson = async <T>(
  executionOptions: ExecutionOptions,
  command: Commands
): Promise<T> => {
  const stdout = await executeProcess(executionOptions, command)
  return JSON.parse(stdout)
}

export const listDvcOnlyRecursive = async (
  executionOptions: ExecutionOptions
): Promise<string[]> =>
  executeWithTrimAndSplit(executionOptions, Commands.LIST_DVC_ONLY_RECURSIVE)

type Status = Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>

export const status = async (
  executionOptions: ExecutionOptions
): Promise<Status> =>
  executeAndParseJson<Status>(executionOptions, Commands.STATUS)

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> => execCommand(options, Commands.EXPERIMENT_QUEUE)

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  execCommand(options, [Commands.EXPERIMENT_GC, ...preserveFlags].join(' '))
