import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Args } from './args'
import { getArgs, getExecutable } from './options'
import { CliError, MaybeConsoleError } from './error'
import { executeProcess } from '../processExecution'
import { Config } from '../config'

export type CliResult = { stderr?: string; command: string; cwd: string }

export interface ICli {
  autoRegisteredCommands: string[]

  processCompleted: EventEmitter<CliResult>
  onDidCompleteProcess: Event<CliResult>

  processStarted: EventEmitter<void>
  onDidStartProcess: Event<void>
}

export const typeCheckCommands = (
  autoRegisteredCommands: Record<string, string>,
  against: ICli
) =>
  Object.values(autoRegisteredCommands).map(value => {
    if (typeof against[value as keyof typeof against] !== 'function') {
      throw new Error(
        `${against.constructor.name} tried to register an internal command that does not exist. ` +
          'If you are a user and see this message then something has gone very wrong.'
      )
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
    const command = [options.executable, ...args].join(' ')
    try {
      this.processStarted.fire()
      const stdout = await executeProcess(options)
      this.processCompleted.fire({ command, cwd })
      return stdout
    } catch (error) {
      const cliError = new CliError({
        baseError: error as MaybeConsoleError,
        options
      })
      this.processCompleted.fire({ command, cwd, stderr: cliError.stderr })
      throw cliError
    }
  }

  private getExecutionOptions(cwd: string, args: Args) {
    return {
      args: getArgs(
        this.config.pythonBinPath,
        this.config.getCliPath(),
        ...args
      ),
      cwd,
      executable: getExecutable(
        this.config.pythonBinPath,
        this.config.getCliPath()
      )
    }
  }
}
