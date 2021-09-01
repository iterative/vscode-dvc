import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Args } from './args'
import { getOptions } from './options'
import { CliError, MaybeConsoleError } from './error'
import { createProcess } from '../processExecution'
import { Config } from '../config'

export type CliResult = {
  stderr?: string
  pid: number | undefined
  command: string
  cwd: string
}

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
    const { command, ...options } = getOptions(
      this.config.pythonBinPath,
      this.config.getCliPath(),
      cwd,
      ...args
    )
    let pid
    try {
      this.processStarted.fire()
      const process = this.dispose.track(createProcess(options))
      pid = process.pid

      const { stdout } = await process

      this.dispose.untrack(process)

      this.processCompleted.fire({ command, cwd, pid })
      return stdout
    } catch (error) {
      const cliError = new CliError({
        baseError: error as MaybeConsoleError,
        options
      })
      this.processCompleted.fire({ command, cwd, pid, stderr: cliError.stderr })
      throw cliError
    }
  }
}
