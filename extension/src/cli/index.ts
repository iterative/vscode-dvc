import { Event, EventEmitter } from 'vscode'
import { CliError, MaybeConsoleError } from './error'
import { getCommandString } from './command'
import { createProcess, Process, ProcessOptions } from '../processExecution'
import { StopWatch } from '../util/time'
import { Disposable } from '../class/dispose'

export type CliEvent = {
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
      throw new TypeError(
        `${against.constructor.name} tried to register an internal command that does not exist. ` +
          'If you are a user and see this message then something has gone very wrong.'
      )
    }
    return value
  })

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

  protected async executeProcess(options: ProcessOptions): Promise<string> {
    const { baseEvent, stopWatch } = this.getProcessDetails(options)
    try {
      const process = this.dispose.track(this.createProcess(baseEvent, options))

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

  protected async createBackgroundProcess(options: ProcessOptions) {
    const { baseEvent, stopWatch } = this.getProcessDetails(options)
    try {
      const backgroundProcess = this.createProcess(baseEvent, {
        detached: true,
        ...options
      })
      return await this.getOutputAndDisconnect(
        baseEvent,
        backgroundProcess,
        stopWatch
      )
    } catch (error: unknown) {
      throw this.processCliError(
        error as MaybeConsoleError,
        options,
        baseEvent,
        stopWatch.getElapsedTime()
      )
    }
  }

  private createProcess(baseEvent: CliEvent, options: ProcessOptions) {
    const createdProcess = createProcess(options)
    baseEvent.pid = createdProcess.pid
    this.processStarted.fire(baseEvent)

    return createdProcess
  }

  private getProcessDetails(options: ProcessOptions) {
    const command = getCommandString(options)
    const baseEvent: CliEvent = { command, cwd: options.cwd, pid: undefined }
    const stopWatch = new StopWatch()
    return { baseEvent, stopWatch }
  }

  private getOutputAndDisconnect(
    baseEvent: CliEvent,
    backgroundProcess: Process,
    stopWatch: StopWatch
  ) {
    let completed = false
    return new Promise<string>(resolve => {
      const readable = backgroundProcess.all
      readable?.on('data', chunk => {
        if (!completed) {
          this.processCompleted.fire({
            ...baseEvent,
            duration: stopWatch.getElapsedTime(),
            exitCode: 0
          })
          completed = true
        }

        resolve(chunk.toString().trim())
        if (backgroundProcess.connected) {
          readable.destroy()
          backgroundProcess.disconnect()
          backgroundProcess.unref()
        }
      })
    })
  }

  private processCliError(
    error: MaybeConsoleError,
    options: ProcessOptions,
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
