import { EventEmitter, Event, window } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { CliResult, getEnv, ICli } from '.'
import { Args, Command, ExperimentFlag, ExperimentSubCommand } from './args'
import { getCommandString } from './command'
import { Config } from '../config'
import { PseudoTerminal } from '../vscode/pseudoTerminal'
import { createProcess, Process } from '../processExecution'
import { setContextValue } from '../vscode/context'

export class CliRunner implements ICli {
  public readonly dispose = Disposable.fn()

  public readonly commandsToRegister = [
    'runExperiment',
    'runExperimentReset',
    'runExperimentQueue'
  ]

  public readonly processCompleted: EventEmitter<CliResult>
  public readonly onDidCompleteProcess: Event<CliResult>

  public readonly processStarted: EventEmitter<void>
  public readonly onDidStartProcess: Event<void>

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
      processStarted: EventEmitter<void>
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
      emitters?.processStarted || this.dispose.track(new EventEmitter<void>())
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
      this.currentProcess?.kill('SIGINT')
      await this.currentProcess
      return false
    } catch (e) {
      const stopped = this.currentProcess?.killed || !this.currentProcess
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
    return this.config.getCliPath() || 'dvc'
  }

  private createProcess({ cwd, args }: { cwd: string; args: Args }): Process {
    const process = createProcess({
      args,
      cwd,
      env: getEnv(this.config.pythonBinPath),
      executable: this.getOverrideOrCliPath()
    })

    this.processStarted.fire()

    process.all?.on('data', chunk => {
      this.processOutput.fire(
        chunk
          .toString()
          .split(/(\r?\n)/g)
          .join('\r')
      )
    })

    process.on('close', () => {
      this.processCompleted.fire({
        command: getCommandString(
          this.config.pythonBinPath,
          this.getOverrideOrCliPath(),
          ...args
        ),
        cwd
      })
    })

    return process
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
}
