import {
  Commands,
  GcPreserveFlag,
  getCommandWithTarget,
  joinCommand
} from './commands'
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
  options: ReaderOptions
): Promise<Record<
  string,
  (Record<string, Record<string, string>> | string)[]
>> => JSON.parse(await execCommand(options, Commands.STATUS))

export const queueExperiment = async (
  options: ReaderOptions
): Promise<string> => execCommand(options, Commands.EXPERIMENT_QUEUE)

export const experimentListCurrent = async (
  readerOptions: ReaderOptions
): Promise<string[]> =>
  trimAndSplit(
    await execCommand(readerOptions, Commands.EXPERIMENT_LIST_NAMES_ONLY)
  )

export const experimentGarbageCollect = async (
  options: ReaderOptions,
  preserveFlags: GcPreserveFlag[]
): Promise<string> =>
  execCommand(options, joinCommand(Commands.EXPERIMENT_GC, preserveFlags))

export const experimentApply = async (
  options: ReaderOptions,
  experiment: string
): Promise<string> =>
  execCommand(
    options,
    getCommandWithTarget(Commands.EXPERIMENT_APPLY, experiment)
  )
