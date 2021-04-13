import { Commands, DvcGcPreserveFlag } from './commands'
import { execPromise, trimAndSplit } from '../util'
import { ExperimentsRepoJSONOutput } from '../webviews/experiments/contract'
import { getPythonExecutionDetails } from '../extensions/python'

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
  const { stdout } = await execCommand(options, Commands.EXPERIMENT_SHOW)
  return JSON.parse(stdout)
}

export const initializeDirectory = async (
  options: ReaderOptions
): Promise<string> => {
  const { stdout } = await execCommand(
    options,
    Commands.INITIALIZE_SUBDIRECTORY
  )
  return stdout
}

export const checkout = async (options: ReaderOptions): Promise<string> => {
  const { stdout } = await execCommand(options, Commands.CHECKOUT)
  return stdout
}

export const checkoutRecursive = async (
  options: ReaderOptions
): Promise<string> => {
  const { stdout } = await execCommand(options, Commands.CHECKOUT_RECURSIVE)
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
  return trimAndSplit(stdout)
}

export const status = async (
  options: ReaderOptions
): Promise<Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>> => {
  const { stdout } = await execCommand(options, Commands.STATUS)
  return JSON.parse(stdout)
}

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> => {
  const { stdout } = await execCommand(options, Commands.QUEUE_EXPERIMENT)
  return stdout
}

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: DvcGcPreserveFlag[]
): Promise<string> => {
  return (
    await execCommand(
      options,
      [Commands.EXPERIMENT_GC, ...preserveFlags].join(' ')
    )
  ).stdout
}
