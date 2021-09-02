import { Event, EventEmitter } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Args } from './args'
import { getOptions } from './options'
import { CliError, MaybeConsoleError } from './error'
import { createProcess } from '../processExecution'
import { Config } from '../config'
import { StopWatch } from '../util/time'

type CliEvent = {
  command: string
  cwd: string
  pid: number | undefined
}

export type CliResult = CliEvent & {
  stderr?: string
  duration: number
  exitCode: number | null
}

export type CliStarted = CliEvent

export interface ICli {
  autoRegisteredCommands: string[]

  processCompleted: EventEmitter<CliResult>
  onDidCompleteProcess: Event<CliResult>

  processStarted: EventEmitter<CliStarted>
  onDidStartProcess: Event<CliStarted>
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

  public readonly processStarted: EventEmitter<CliStarted>
  public readonly onDidStartProcess: Event<CliStarted>

  protected config: Config

  constructor(
    config: Config,
    emitters?: {
      processStarted: EventEmitter<CliStarted>
      processCompleted: EventEmitter<CliResult>
    }
  ) {
    this.config = config

    this.processCompleted =
      emitters?.processCompleted ||
      this.dispose.track(new EventEmitter<CliResult>())
    this.onDidCompleteProcess = this.processCompleted.event

    this.processStarted =
      emitters?.processStarted ||
      this.dispose.track(new EventEmitter<CliStarted>())
    this.onDidStartProcess = this.processStarted.event
  }

  public async executeProcess(cwd: string, ...args: Args): Promise<string> {
    const { command, ...options } = this.getOptions(cwd, ...args)

    const baseEvent: CliEvent = { command, cwd, pid: undefined }
    const stopWatch = new StopWatch()
    try {
      const process = this.dispose.track(createProcess(options))

      baseEvent.pid = process.pid
      this.processStarted.fire(baseEvent)

      const { stdout, exitCode } = await process

      this.dispose.untrack(process)

      this.processCompleted.fire({
        ...baseEvent,
        duration: stopWatch.getElapsedTime(),
        exitCode
      })
      return stdout
    } catch (error) {
      const cliError = new CliError({
        baseError: error as MaybeConsoleError,
        options
      })
      this.processCompleted.fire({
        ...baseEvent,
        duration: stopWatch.getElapsedTime(),
        exitCode: cliError.exitCode,
        stderr: cliError.stderr
      })
      throw cliError
    }
  }

  private getOptions(cwd: string, ...args: Args) {
    return getOptions(
      this.config.pythonBinPath,
      this.config.getCliPath(),
      cwd,
      ...args
    )
  }
}
