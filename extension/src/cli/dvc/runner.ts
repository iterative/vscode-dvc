import { EventEmitter, Event } from 'vscode'
import {
  Args,
  Command,
  ExperimentFlag,
  ExperimentSubCommand
} from './constants'
import { getOptions } from './options'
import { CliResult, CliStarted, ICli, typeCheckCommands } from '..'
import { getCommandString } from '../command'
import { Config } from '../../config'
import { PseudoTerminal } from '../../vscode/pseudoTerminal'
import { createProcess, Process } from '../../process/execution'
import { StopWatch } from '../../util/time'
import { Toast } from '../../vscode/toast'
import { Disposable } from '../../class/dispose'
import {
  captureStdErr,
  notifyCompleted,
  notifyOutput,
  notifyStarted
} from '../util'

export const autoRegisteredCommands = {
  EXPERIMENT_RESET_AND_RUN: 'runExperimentReset',
  EXPERIMENT_RUN: 'runExperiment'
} as const

export class DvcRunner extends Disposable implements ICli {
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

  private readonly executable: string | undefined

  private readonly pseudoTerminal: PseudoTerminal
  private currentProcess: Process | undefined
  private readonly config: Config

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
    super()

    this.config = config

    this.executable = executable

    this.processCompleted =
      emitters?.processCompleted ||
      this.dispose.track(new EventEmitter<CliResult>())
    this.onDidCompleteProcess = this.processCompleted.event
    this.dispose.track(
      this.onDidCompleteProcess(() => {
        this.pseudoTerminal.setBlocked(false)
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
        void this.stop()
      })
    )

    this.pseudoTerminal = this.dispose.track(
      new PseudoTerminal(this.processOutput, this.processTerminated)
    )
  }

  public runExperiment(dvcRoot: string, ...args: Args) {
    return this.run(
      dvcRoot,
      Command.EXPERIMENT,
      ExperimentSubCommand.RUN,
      ...args
    )
  }

  public runExperimentReset(dvcRoot: string, ...args: Args) {
    return this.runExperiment(dvcRoot, ExperimentFlag.RESET, ...args)
  }

  public async run(cwd: string, ...args: Args) {
    await this.pseudoTerminal.openCurrentInstance()
    if (!this.pseudoTerminal.isBlocked()) {
      return this.startProcess(cwd, args)
    }
    void Toast.showError(
      `Cannot start dvc ${args.join(
        ' '
      )} as the output terminal is already occupied.`
    )
  }

  public stop() {
    const stopped = new Promise<boolean>(resolve => {
      if (!this.currentProcess) {
        return resolve(false)
      }
      const listener = this.dispose.track(
        this.currentProcess.onDidDispose(disposed => {
          this.dispose.untrack(listener)
          listener?.dispose()
          this.pseudoTerminal.close()
          resolve(disposed)
        })
      )
    })

    try {
      this.currentProcess?.dispose()
    } catch {}

    return stopped
  }

  public isExperimentRunning() {
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
    const options = this.getOptions(cwd, args)
    const command = getCommandString(options)
    const stopWatch = new StopWatch()
    const process = this.dispose.track(createProcess(options))
    const baseEvent = { command, cwd, pid: process.pid }

    notifyStarted(baseEvent, this.processStarted)

    notifyOutput(process, this.processOutput)

    const stderr = captureStdErr(process)

    void process.on('close', exitCode => {
      void this.dispose.untrack(process)
      notifyCompleted(
        {
          ...baseEvent,
          duration: stopWatch.getElapsedTime(),
          exitCode,
          stderr
        },
        this.processCompleted
      )
    })

    return process
  }

  private getOptions(cwd: string, args: Args) {
    return getOptions(
      this.config.getPythonBinPath(),
      this.getOverrideOrCliPath(),
      cwd,
      ...args
    )
  }

  private startProcess(cwd: string, args: Args) {
    this.pseudoTerminal.setBlocked(true)
    this.processOutput.fire(`Running: dvc ${args.join(' ')}\r\n\n`)
    this.currentProcess = this.createProcess({
      args,
      cwd
    })
  }
}
