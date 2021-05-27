import { getEmitter } from '../vscode/EventEmitter'
import { getProcessEnv } from '../env'
import { Args } from './args'
import { trimAndSplit } from '../util/stdout'
import { executeProcess } from '../processExecution'
import { Config } from '../Config'
import { CliProcessError } from '../vscode/reporting'

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

export const getEnv = (pythonBinPath?: string): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, pythonBinPath)
  return {
    ...env,
    PATH
  }
}

const getExecutionDetails = (
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

export class CliExecution {
  private static e = getEmitter<string>()
  public static onDidRun = CliExecution.e.event

  public static async executeCliProcess(
    options: ExecutionOptions,
    ...args: Args
  ): Promise<string> {
    const { executable, cwd, env } = getExecutionDetails(options)
    const command = `dvc ${args.join(' ')}`
    try {
      const stdout = await executeProcess({
        executable,
        args,
        cwd,
        env
      })
      CliExecution.e?.fire(`> ${command}\n`)
      return stdout
    } catch (error) {
      const cliError = new CliProcessError({ options, args, baseError: error })
      CliExecution.e?.fire(`> ${command} failed. ${cliError.stderr}\n`)
      throw cliError
    }
  }

  public static readCliProcess = async <T = string>(
    options: ExecutionOptions,
    formatter: typeof trimAndSplit | typeof JSON.parse | undefined,
    ...args: Args
  ): Promise<T> => {
    const output = await CliExecution.executeCliProcess(options, ...args)
    if (!formatter) {
      return (output as unknown) as T
    }
    return (formatter(output) as unknown) as T
  }
}
