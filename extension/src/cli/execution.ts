import { EventEmitter } from 'vscode'
import { getProcessEnv } from '../env'
import { Commands } from './commands'
import { execPromise } from '../util/exec'
import { trim, trimAndSplit } from '../util/stdout'
import execa, { ExecaChildProcess } from 'execa'

export interface ReaderOptions {
  cliPath: string | undefined
  pythonBinPath: string | undefined
  cwd: string
}

export type ExecutionOptions = ReaderOptions & {
  command: Commands
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
  command: string
  cwd: string
  env: NodeJS.ProcessEnv
} => {
  const { command, cliPath, pythonBinPath } = options
  return {
    env: getEnv(pythonBinPath),
    command: `${cliPath || 'dvc'} ${command}`,
    cwd: options.cwd
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
}): ExecaChildProcess<string> => {
  const { command, cwd, env } = getExecutionDetails(options)

  const [executable, ...args] = command.split(' ')

  const childProcess = execa(executable, args, {
    all: true,
    cwd,
    env
  })

  emitters?.startedEventEmitter?.fire()

  childProcess.all?.on('data', chunk => {
    const output = getOutput(chunk)
    emitters?.outputEventEmitter?.fire(output)
  })

  childProcess.on('close', () => {
    emitters?.completedEventEmitter?.fire()
  })

  return childProcess
}

export const execProcess = async <T>(
  options: ReaderOptions,
  partialCommand: Commands,
  formatter: typeof trimAndSplit | typeof trim | typeof JSON.parse = trim
): Promise<T> => {
  const { command, cwd, env } = getExecutionDetails({
    ...options,
    command: partialCommand
  })
  const { stdout } = await execPromise(command, {
    cwd,
    env
  })
  return (formatter(stdout) as unknown) as T
}
