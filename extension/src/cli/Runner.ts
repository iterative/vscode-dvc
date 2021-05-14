import { EventEmitter, Event, window } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../Config'
import { PseudoTerminal } from '../PseudoTerminal'
import { Args } from './args'
import { createCliProcess } from './execution'
import { Process } from '../processExecution'
import { setContextValue } from '../vscode/context'

export class Runner {
  public readonly dispose = Disposable.fn()

  private static setRunningContext = (isRunning: boolean) =>
    setContextValue('dvc.runner.running', isRunning)

  private readonly processCompleted: EventEmitter<void>
  public readonly onDidCompleteProcess: Event<void>

  private readonly processOutput: EventEmitter<string>

  private readonly processStarted: EventEmitter<void>

  private readonly processTerminated: EventEmitter<void>
  private readonly onDidTerminateProcess: Event<void>

  private executable: string | undefined

  private pseudoTerminal: PseudoTerminal
  private currentProcess: Process | undefined
  private config: Config

  private getOverrideOrCliPath() {
    if (this.executable) {
      return this.executable
    }
    return this.config.getCliPath()
  }

  private startProcess(cwd: string, args: Args) {
    Runner.setRunningContext(true)
    this.pseudoTerminal.setBlocked(true)
    this.processOutput.fire(`Running: dvc ${args.join(' ')}\r\n\n`)
    this.currentProcess = createCliProcess({
      options: {
        cliPath: this.getOverrideOrCliPath(),
        cwd,
        pythonBinPath: this.config.pythonBinPath
      },
      emitters: {
        processCompleted: this.processCompleted,
        processStarted: this.processStarted,
        processOutput: this.processOutput
      },
      args
    })
  }

  public async run(cwd: string, ...args: Args) {
    await this.pseudoTerminal.openCurrentInstance()
    if (!this.pseudoTerminal.isBlocked()) {
      return this.startProcess(cwd, args)
    }
    window.showErrorMessage(
      `Cannot start dvc ${args.join(
        ' '
      )} as the output terminal is already occupied`
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

  constructor(
    config: Config,
    executable?: string,
    emitters?: {
      processCompleted: EventEmitter<void>
      processOutput: EventEmitter<string>
      processStarted: EventEmitter<void>
      processTerminated?: EventEmitter<void>
    }
  ) {
    this.config = config

    this.executable = executable

    this.processCompleted =
      emitters?.processCompleted || this.dispose.track(new EventEmitter<void>())
    this.onDidCompleteProcess = this.processCompleted.event
    this.dispose.track(
      this.onDidCompleteProcess(() => {
        this.pseudoTerminal.setBlocked(false)
        Runner.setRunningContext(false)
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
}
