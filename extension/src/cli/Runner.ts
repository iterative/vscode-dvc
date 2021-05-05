import { EventEmitter, Event, window } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../Config'
import { PseudoTerminal } from '../PseudoTerminal'
import { Args } from './args'
import { createCliProcess } from './execution'
import { Process } from '../processExecution'

export class Runner {
  public readonly dispose = Disposable.fn()

  private outputEventEmitter: EventEmitter<string>
  private completedEventEmitter: EventEmitter<void>
  private startedEventEmitter: EventEmitter<void>
  private terminatedEventEmitter: EventEmitter<void>

  public onDidComplete: Event<void>
  private onDidTerminate: Event<void>

  private pseudoTerminal: PseudoTerminal
  private currentProcess: Process | undefined
  private config: Config

  private async startProcess(cwd: string, args: Args) {
    this.pseudoTerminal.setBlocked(true)
    this.outputEventEmitter.fire(`Running: dvc ${args.join(' ')}\r\n\n`)
    await this.config.ready
    this.currentProcess = createCliProcess({
      options: {
        cliPath: this.config.dvcPath,
        cwd,
        pythonBinPath: this.config.pythonBinPath
      },
      emitters: {
        completedEventEmitter: this.completedEventEmitter,
        startedEventEmitter: this.startedEventEmitter,
        outputEventEmitter: this.outputEventEmitter
      },
      args
    })
  }

  public async run(cwd: string, ...args: Args) {
    await this.pseudoTerminal.openCurrentInstance()
    if (!this.pseudoTerminal.isBlocked) {
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
    emitters?: {
      outputEventEmitter: EventEmitter<string>
      completedEventEmitter: EventEmitter<void>
      startedEventEmitter: EventEmitter<void>
      terminatedEventEmitter?: EventEmitter<void>
    }
  ) {
    this.config = config

    this.completedEventEmitter =
      emitters?.completedEventEmitter ||
      this.dispose.track(new EventEmitter<void>())
    this.onDidComplete = this.completedEventEmitter.event
    this.dispose.track(
      this.onDidComplete(() => {
        this.pseudoTerminal.setBlocked(false)
        this.outputEventEmitter.fire(
          '\r\nTerminal will be reused by DVC, press any key to close it\r\n\n'
        )
        this.currentProcess = undefined
      })
    )

    this.outputEventEmitter =
      emitters?.outputEventEmitter ||
      this.dispose.track(new EventEmitter<string>())

    this.startedEventEmitter =
      emitters?.startedEventEmitter ||
      this.dispose.track(new EventEmitter<void>())

    this.terminatedEventEmitter =
      emitters?.terminatedEventEmitter ||
      this.dispose.track(new EventEmitter<void>())
    this.onDidTerminate = this.terminatedEventEmitter.event
    this.dispose.track(
      this.onDidTerminate(() => {
        this.stop()
      })
    )

    this.pseudoTerminal = this.dispose.track(
      new PseudoTerminal(this.outputEventEmitter, this.terminatedEventEmitter)
    )
  }
}
