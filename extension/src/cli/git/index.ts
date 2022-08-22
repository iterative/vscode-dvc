import { Event, EventEmitter } from 'vscode'
import { CliEvent, CliResult, CliStarted, ICli } from '..'
import { Disposable } from '../../class/dispose'
import { createProcess } from '../../processExecution'
import { StopWatch } from '../../util/time'
import { CliError, MaybeConsoleError } from '../error'
import { ExecutionOptions } from '../options'

export class Cli extends Disposable implements ICli {
  public autoRegisteredCommands: string[] = []

  public readonly processCompleted: EventEmitter<CliResult>
  public readonly onDidCompleteProcess: Event<CliResult>

  public readonly processStarted: EventEmitter<CliStarted>
  public readonly onDidStartProcess: Event<CliStarted>

  constructor(emitters?: {
    processStarted: EventEmitter<CliStarted>
    processCompleted: EventEmitter<CliResult>
  }) {
    super()

    this.processCompleted =
      emitters?.processCompleted ||
      this.dispose.track(new EventEmitter<CliResult>())
    this.onDidCompleteProcess = this.processCompleted.event

    this.processStarted =
      emitters?.processStarted ||
      this.dispose.track(new EventEmitter<CliStarted>())
    this.onDidStartProcess = this.processStarted.event
  }

  public async executeProcess(
    cwd: string,
    command: string,
    options: ExecutionOptions
  ): Promise<string> {
    const baseEvent: CliEvent = { command, cwd, pid: undefined }
    const stopWatch = new StopWatch()
    try {
      const process = this.dispose.track(createProcess(options))

      baseEvent.pid = process.pid
      this.processStarted.fire(baseEvent)

      process.on('close', () => {
        this.dispose.untrack(process)
      })

      const { stdout, exitCode } = await process

      this.processCompleted.fire({
        ...baseEvent,
        duration: stopWatch.getElapsedTime(),
        exitCode
      })
      return stdout
    } catch (error: unknown) {
      throw this.processCliError(
        error as MaybeConsoleError,
        options,
        baseEvent,
        stopWatch.getElapsedTime()
      )
    }
  }

  private processCliError(
    error: MaybeConsoleError,
    options: ExecutionOptions,
    baseEvent: CliEvent,
    duration: number
  ) {
    const cliError = new CliError({
      baseError: error as MaybeConsoleError,
      options
    })
    this.processCompleted.fire({
      ...baseEvent,
      duration,
      exitCode: cliError.exitCode,
      stderr: cliError.stderr
    })
    return cliError
  }
}
