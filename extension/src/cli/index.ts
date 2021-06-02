import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Args } from './args'
import { CliError } from './error'
import { getProcessEnv } from '../env'
import { executeProcess } from '../processExecution'
import { Config } from '../config'

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

export type CliResult = { stderr?: string; command: string }

export class Cli {
  public dispose = Disposable.fn()

  protected config: Config

  private processCompleted: EventEmitter<CliResult>
  public onDidCompleteProcess: Event<CliResult>

  private readonly processStarted: EventEmitter<void>
  public readonly onDidStartProcess: Event<void>

  private getExecutionOptions(cwd: string, args: Args) {
    return {
      args,
      cwd,
      env: getEnv(this.config.pythonBinPath),
      executable: this.config.getCliPath() || 'dvc'
    }
  }

  public async executeProcess(cwd: string, ...args: Args): Promise<string> {
    const command = `dvc ${args.join(' ')}`
    const options = this.getExecutionOptions(cwd, args)
    try {
      this.processStarted.fire()
      const stdout = await executeProcess(options)
      this.processCompleted.fire({ command })
      return stdout
    } catch (error) {
      const cliError = new CliError({ baseError: error, options })
      this.processCompleted.fire({ command, stderr: cliError.stderr })
      throw cliError
    }
  }

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
}
