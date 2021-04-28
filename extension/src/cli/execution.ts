import { EventEmitter } from 'vscode'
import { getProcessEnv } from '../env'
import { Args } from './commands'
import { trimAndSplit } from '../util/stdout'
import { createProcess, Process, runProcess } from '../processExecution'

export interface ExecutionOptions {
  cliPath: string | undefined
  pythonBinPath: string | undefined
  cwd: string
}

const getPATH = (existingPath: string, pythonBinPath?: string): string =>
  [pythonBinPath, existingPath].filter(Boolean).join(':')

const getEnv = (pythonBinPath?: string): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, pythonBinPath)
  return {
    ...env,
    PATH
  }
}

export const getExecutionDetails = (
  options: ExecutionOptions
): {
  cwd: string
  env: NodeJS.ProcessEnv
  executable: string
} => {
  const { cliPath, pythonBinPath, cwd } = options
  return {
    cwd,
    env: getEnv(pythonBinPath),
    executable: cliPath || 'dvc'
  }
}

const getOutput = (data: string | Buffer): string =>
  data
    .toString()
    .split(/(\r?\n)/g)
    .join('\r')

export const createCliProcess = ({
  options,
  emitters,
  args
}: {
  options: ExecutionOptions
  args: Args
  emitters?: {
    completedEventEmitter?: EventEmitter<void>
    outputEventEmitter?: EventEmitter<string>
    startedEventEmitter?: EventEmitter<void>
  }
}): Process => {
  const { executable, cwd, env } = getExecutionDetails(options)

  const process = createProcess({
    executable,
    args,
    cwd,
    env
  })

  emitters?.startedEventEmitter?.fire()

  process.all?.on('data', chunk => {
    const output = getOutput(chunk)
    emitters?.outputEventEmitter?.fire(output)
  })

  process.on('close', () => {
    emitters?.completedEventEmitter?.fire()
  })

  return process
}

export const runCliProcess = async (
  options: ExecutionOptions,
  ...args: Args
): Promise<string> => {
  const { executable, cwd, env } = getExecutionDetails(options)
  return runProcess({
    executable,
    args,
    cwd,
    env
  })
}

export const readCliProcessJson = async <T>(
  options: ExecutionOptions,
  ...args: Args
): Promise<T> => {
  const { executable, cwd, env } = getExecutionDetails(options)
  const output = await runProcess({
    executable,
    args,
    cwd,
    env
  })
  return (JSON.parse(output) as unknown) as T
}

export const readCliProcessSplit = async (
  options: ExecutionOptions,
  ...args: Args
): Promise<string[]> => {
  const { executable, cwd, env } = getExecutionDetails(options)
  const output = await runProcess({
    executable,
    args,
    cwd,
    env
  })
  return trimAndSplit(output)
}
