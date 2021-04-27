import { EventEmitter } from 'vscode'
import { getProcessEnv } from '../env'
import { Commands, ExperimentSubCommands, Flags } from './commands'
import { trim, trimAndSplit } from '../util/stdout'
import { createProcess, Process, runProcess } from '../processExecution'

export interface ReaderOptions {
  cliPath: string | undefined
  pythonBinPath: string | undefined
  cwd: string
}

export type ExecutionOptions = ReaderOptions & {
  args: (Commands | ExperimentSubCommands | Flags)[]
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
  args: string[]
  cwd: string
  env: NodeJS.ProcessEnv
  executable: string
} => {
  const { cliPath, pythonBinPath, args, cwd } = options
  return {
    args,
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

export const spawnProcess = ({
  options,
  emitters
}: {
  options: ExecutionOptions
  emitters?: {
    completedEventEmitter?: EventEmitter<void>
    outputEventEmitter?: EventEmitter<string>
    startedEventEmitter?: EventEmitter<void>
  }
}): Process => {
  const { executable, args, cwd, env } = getExecutionDetails(options)

  const process = createProcess({
    executable,
    args: args || [],
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

export const execProcess = async <T>(
  options: ReaderOptions,
  args: (Commands | ExperimentSubCommands | Flags)[],
  formatter: typeof trimAndSplit | typeof trim | typeof JSON.parse = trim
): Promise<T> => {
  const { executable, cwd, env } = getExecutionDetails({
    ...options,
    args
  })
  const output = await runProcess({
    executable,
    args,
    cwd,
    env
  })
  return (formatter(output) as unknown) as T
}
