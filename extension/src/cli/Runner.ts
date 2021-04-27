import { EventEmitter, Event, window } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../Config'
import { PseudoTerminal } from '../PseudoTerminal'
import { Args } from './commands'
import { spawnProcess } from './execution'
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

  private async startProcess(args: Args, cwd: string) {
    this.pseudoTerminal.setBlocked(true)
    this.outputEventEmitter.fire(`Running: dvc ${args.join(' ')}\r\n\n`)
    await this.config.ready
    this.currentProcess = spawnProcess({
      options: {
        cliPath: this.config.dvcPath,
        args,
        cwd,
        pythonBinPath: this.config.pythonBinPath
      },
      emitters: {
        completedEventEmitter: this.completedEventEmitter,
        startedEventEmitter: this.startedEventEmitter,
        outputEventEmitter: this.outputEventEmitter
      }
    })
  }

  public async run(args: Args, cwd: string) {
    await this.pseudoTerminal.openCurrentInstance()
    if (!this.pseudoTerminal.isBlocked) {
      return this.startProcess(args, cwd)
    }
    window.showErrorMessage(
      `Cannot start ${args.join(
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

  constructor(config: Config) {
    this.config = config

    this.completedEventEmitter = this.dispose.track(new EventEmitter<void>())
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

    this.outputEventEmitter = this.dispose.track(new EventEmitter<string>())

    this.startedEventEmitter = this.dispose.track(new EventEmitter<void>())

    this.terminatedEventEmitter = this.dispose.track(new EventEmitter<void>())
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
