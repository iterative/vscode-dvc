import { EventEmitter, Event, window } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { CliResult, CliStarted, ICli, typeCheckCommands } from '.'
import { Args, Command, ExperimentFlag, ExperimentSubCommand } from './args'
import { getOptions } from './options'
import { Config } from '../config'
import { PseudoTerminal } from '../vscode/pseudoTerminal'
import { createProcess, Process } from '../processExecution'
import { setContextValue } from '../vscode/context'
import { StopWatch } from '../util/time'
import { sendErrorTelemetryEvent, sendTelemetryEvent } from '../telemetry'
import { EventName } from '../telemetry/constants'

export const autoRegisteredCommands = {
  EXPERIMENT_RUN: 'runExperiment',
  EXPERIMENT_RUN_QUEUED: 'runExperimentQueue',
  EXPERIMENT_RUN_RESET: 'runExperimentReset'
} as const

export class CliRunner implements ICli {
  public readonly dispose = Disposable.fn()

  public readonly autoRegisteredCommands = typeCheckCommands(
    autoRegisteredCommands,
    this
  )

  public readonly processCompleted: EventEmitter<CliResult>
  public readonly onDidCompleteProcess: Event<CliResult>

  public readonly processStarted: EventEmitter<CliStarted>
  public readonly onDidStartProcess: Event<CliStarted>

  private readonly processOutput: EventEmitter<string>

  private readonly processTerminated: EventEmitter<void>
  private readonly onDidTerminateProcess: Event<void>

  private executable: string | undefined

  private pseudoTerminal: PseudoTerminal
  private currentProcess: Process | undefined
  private config: Config

  constructor(
    config: Config,
    executable?: string,
    emitters?: {
      processCompleted: EventEmitter<CliResult>
      processOutput: EventEmitter<string>
      processStarted: EventEmitter<CliStarted>
      processTerminated?: EventEmitter<void>
    }
  ) {
    this.config = config

    this.executable = executable

    this.processCompleted =
      emitters?.processCompleted ||
      this.dispose.track(new EventEmitter<CliResult>())
    this.onDidCompleteProcess = this.processCompleted.event
    this.dispose.track(
      this.onDidCompleteProcess(() => {
        this.pseudoTerminal.setBlocked(false)
        CliRunner.setRunningContext(false)
        this.processOutput.fire(
          '\r\nTerminal will be reused by DVC, press any key to close it\r\n\n'
        )
        this.currentProcess = undefined
      })
    )

    this.processOutput =
      emitters?.processOutput || this.dispose.track(new EventEmitter<string>())

    this.processStarted =
      emitters?.processStarted ||
      this.dispose.track(new EventEmitter<CliStarted>())
    this.onDidStartProcess = this.processStarted.event

    this.processTerminated =
      emitters?.processTerminated ||
      this.dispose.track(new EventEmitter<void>())
    this.onDidTerminateProcess = this.processTerminated.event
    this.dispose.track(
      this.onDidTerminateProcess(() => {
        this.stop()
      })
    )

    this.pseudoTerminal = this.dispose.track(
      new PseudoTerminal(this.processOutput, this.processTerminated)
    )
  }

  private static setRunningContext = (isRunning: boolean) =>
    setContextValue('dvc.runner.running', isRunning)

  public runExperiment(dvcRoot: string, ...args: Args) {
    return this.run(
      dvcRoot,
      Command.EXPERIMENT,
      ExperimentSubCommand.RUN,
      ...args
    )
  }

  public runExperimentReset(dvcRoot: string) {
    return this.runExperiment(dvcRoot, ExperimentFlag.RESET)
  }

  public runExperimentQueue(dvcRoot: string) {
    return this.runExperiment(dvcRoot, ExperimentFlag.RUN_ALL)
  }

  public async run(cwd: string, ...args: Args) {
    await this.pseudoTerminal.openCurrentInstance()
    if (!this.pseudoTerminal.isBlocked()) {
      return this.startProcess(cwd, args)
    }
    window.showErrorMessage(
      `Cannot start dvc ${args.join(
        ' '
      )} as the output terminal is already occupied.`
    )
  }

  public async stop() {
    try {
      this.currentProcess?.dispose()
      await this.currentProcess
      return false
    } catch {
      const stopped = !this.currentProcess || this.currentProcess.killed
      if (stopped) {
        this.pseudoTerminal.close()
      }
      return stopped
    }
  }

  public isRunning() {
    return !!this.currentProcess
  }

  public getRunningProcess() {
    return this.currentProcess
  }

  private getOverrideOrCliPath() {
    if (this.executable) {
      return this.executable
    }
    return this.config.getCliPath()
  }

  private createProcess({ cwd, args }: { cwd: string; args: Args }): Process {
    const { command, ...options } = this.getOptions(cwd, args)
    const stopWatch = new StopWatch()
    const process = this.dispose.track(createProcess(options))
    const baseEvent = { command, cwd, pid: process.pid }

    this.processStarted.fire(baseEvent)

    this.notifyOutput(process)

    let stderr = ''
    process.stderr?.on('data', chunk => (stderr += chunk.toString()))

    process.on('close', exitCode => {
      this.dispose.untrack(process)
      this.notifyCompleted({
        ...baseEvent,
        duration: stopWatch.getElapsedTime(),
        exitCode,
        killed: process.killed,
        stderr
      })
    })

    return process
  }

  private getOptions(cwd: string, args: Args) {
    return getOptions(
      this.config.pythonBinPath,
      this.getOverrideOrCliPath(),
      cwd,
      ...args
    )
  }

  private startProcess(cwd: string, args: Args) {
    CliRunner.setRunningContext(true)
    this.pseudoTerminal.setBlocked(true)
    this.processOutput.fire(`Running: dvc ${args.join(' ')}\r\n\n`)
    this.currentProcess = this.createProcess({
      args,
      cwd
    })
  }

  private notifyOutput(process: Process) {
    process.all?.on('data', chunk =>
      this.processOutput.fire(
        chunk
          .toString()
          .split(/(\r?\n)/g)
          .join('\r')
      )
    )
  }

  private notifyCompleted({
    command,
    pid,
    cwd,
    duration,
    exitCode,
    killed,
    stderr
  }: CliResult & {
    killed: boolean
  }) {
    this.processCompleted.fire({
      command,
      cwd,
      duration,
      exitCode,
      pid,
      stderr: stderr?.replace(/\n+/g, '\n')
    })

    this.sendTelemetryEvent({ command, duration, exitCode, killed, stderr })
  }

  private sendTelemetryEvent({
    command,
    exitCode,
    stderr,
    duration,
    killed
  }: {
    command: string
    exitCode: number | null
    stderr?: string
    duration: number
    killed: boolean
  }) {
    const properties = { command, exitCode }

    if (!killed && exitCode && stderr) {
      return sendErrorTelemetryEvent(
        EventName.EXPERIMENTS_RUNNER_COMPLETED,
        new Error(stderr),
        duration,
        properties
      )
    }

    return sendTelemetryEvent(
      EventName.EXPERIMENTS_RUNNER_COMPLETED,
      { ...properties, wasStopped: killed },
      { duration }
    )
  }
}
