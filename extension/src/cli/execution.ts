import { EventEmitter, OutputChannel, window } from 'vscode'
import { getProcessEnv } from '../env'
import { Args, Command, Flag } from './args'
import { trimAndSplit } from '../util/stdout'
import { createProcess, Process, executeProcess } from '../processExecution'
import { Config } from '../Config'

export type BaseExecutionOptions = {
  cliPath: string | undefined
  pythonBinPath: string | undefined
}

type CwdOption = {
  cwd: string
}

export type ExecutionOptions = BaseExecutionOptions & CwdOption

export const getExecutionOptions = (
  config: Config,
  path: string
): ExecutionOptions => ({
  cliPath: config.getCliPath(),
  cwd: path,
  pythonBinPath: config.pythonBinPath
})

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
    processCompleted?: EventEmitter<void>
    processOutput?: EventEmitter<string>
    processStarted?: EventEmitter<void>
  }
}): Process => {
  const { executable, cwd, env } = getExecutionDetails(options)

  const process = createProcess({
    executable,
    args,
    cwd,
    env
  })

  emitters?.processStarted?.fire()

  process.all?.on('data', chunk => {
    const output = getOutput(chunk)
    emitters?.processOutput?.fire(output)
  })

  process.on('close', () => {
    emitters?.processCompleted?.fire()
  })

  return process
}

class CliExecutor {
  e = new EventEmitter<string>()
  private outputChannel: OutputChannel

  public async executeCliProcess(
    options: ExecutionOptions,
    ...args: Args
  ): Promise<string> {
    const { executable, cwd, env } = getExecutionDetails(options)
    try {
      this.outputChannel?.append(`> dvc ${args.join(' ')}\n`)
      return await executeProcess({
        executable,
        args,
        cwd,
        env
      })
    } catch (e) {
      this.outputChannel?.append(e)
      throw e
    }
  }

  constructor() {
    this.outputChannel = window.createOutputChannel('DVC')
  }
}

const x = new CliExecutor()

export const executeCliProcess = (
  options: ExecutionOptions,
  ...args: Args
): Promise<string> => {
  const { executable, cwd, env } = getExecutionDetails(options)
  return executeProcess({
    executable,
    args,
    cwd,
    env
  })
}

export const readCliProcess = async <T = string>(
  options: ExecutionOptions,
  formatter: typeof trimAndSplit | typeof JSON.parse | undefined,
  ...args: Args
): Promise<T> => {
  const output = await x.executeCliProcess(options, ...args)
  if (!formatter) {
    return (output as unknown) as T
  }
  return (formatter(output) as unknown) as T
}

export const readCliProcessJson = <T>(
  options: ExecutionOptions,
  command: Command,
  ...args: Args
) => readCliProcess<T>(options, JSON.parse, command, ...args, Flag.SHOW_JSON)
