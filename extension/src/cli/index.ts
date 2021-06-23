import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Args } from './args'
import { getCommandString } from './command'
import { CliError } from './error'
import { getProcessEnv } from '../env'
import { executeProcess } from '../processExecution'
import { Config } from '../config'
import { joinTruthyItems } from '../util/array'

const getPATH = (existingPath: string, pythonBinPath?: string): string =>
  joinTruthyItems([pythonBinPath, existingPath], ':')

export const getEnv = (pythonBinPath?: string): NodeJS.ProcessEnv => {
  const env = getProcessEnv()
  const PATH = getPATH(env?.PATH as string, pythonBinPath)
  return {
    ...env,
    PATH
  }
}

export type CliResult = { stderr?: string; command: string; cwd: string }

export interface ICli {
  autoRegisteredCommands: string[]

  processCompleted: EventEmitter<CliResult>
  onDidCompleteProcess: Event<CliResult>

  processStarted: EventEmitter<void>
  onDidStartProcess: Event<void>
}

export const typeCheckCommands = (
  autoRegisteredCommands: object,
  against: ICli
) =>
  Object.values(autoRegisteredCommands).map(value => {
    if (typeof against[value as keyof typeof against] !== 'function') {
      throw new Error(`${against.constructor.name} did something stupid`)
    }
    return value
  })

export class Cli implements ICli {
  public dispose = Disposable.fn()

  public autoRegisteredCommands: string[] = []

  public readonly processCompleted: EventEmitter<CliResult>
  public readonly onDidCompleteProcess: Event<CliResult>

  public readonly processStarted: EventEmitter<void>
  public readonly onDidStartProcess: Event<void>

  protected config: Config

  constructor(
    config: Config,
    emitters?: {
      processStarted: EventEmitter<void>
      processCompleted: EventEmitter<CliResult>
    }
  ) {
    this.config = config

    this.processCompleted =
      emitters?.processCompleted ||
      this.dispose.track(new EventEmitter<CliResult>())
    this.onDidCompleteProcess = this.processCompleted.event

    this.processStarted =
      emitters?.processStarted || this.dispose.track(new EventEmitter<void>())
    this.onDidStartProcess = this.processStarted.event
  }

  public async executeProcess(cwd: string, ...args: Args): Promise<string> {
    const options = this.getExecutionOptions(cwd, args)
    const command = getCommandString(
      this.config.pythonBinPath,
      options.executable,
      ...args
    )
    try {
      this.processStarted.fire()
      const stdout = await executeProcess(options)
      this.processCompleted.fire({ command, cwd })
      return stdout
    } catch (error) {
      const cliError = new CliError({ baseError: error, options })
      this.processCompleted.fire({ command, cwd, stderr: cliError.stderr })
      throw cliError
    }
  }

  private getExecutionOptions(cwd: string, args: Args) {
    return {
      args,
      cwd,
      env: getEnv(this.config.pythonBinPath),
      executable: this.config.getCliPath() || 'dvc'
    }
  }
}
