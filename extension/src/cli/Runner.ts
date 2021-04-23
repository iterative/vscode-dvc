import { EventEmitter, Event, window } from 'vscode'
import { ChildProcess } from 'child_process'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../Config'
import { PseudoTerminal } from '../PseudoTerminal'
import { Commands } from './commands'
import { spawnProcess } from './execution'

const getOutput = (data: string | Buffer): string =>
  data
    .toString()
    .split(/(\r?\n)/g)
    .join('\r')

export class Runner {
  public readonly dispose = Disposable.fn()

  private stdOutEventEmitter: EventEmitter<string>
  private completedEventEmitter: EventEmitter<void>
  private startedEventEmitter: EventEmitter<void>
  private terminatedEventEmitter: EventEmitter<void>

  private onDidComplete: Event<void>
  public onDidTerminate: Event<void>

  private pseudoTerminal: PseudoTerminal
  private currentProcess: ChildProcess | undefined
  private config: Config

  private async startProcess(command: Commands, cwd: string) {
    this.pseudoTerminal.setBlocked(true)
    this.stdOutEventEmitter.fire(`Running: dvc ${command}\r\n\n`)
    await this.config.ready
    const promise = spawnProcess(
      {
        cliPath: this.config.dvcPath,
        cwd,
        pythonBinPath: this.config.pythonBinPath
      },
      command
    )
    const childProcess = promise.child
    this.startedEventEmitter.fire()
    childProcess.stdout?.on('data', data =>
      this.stdOutEventEmitter.fire(getOutput(data))
    )
    childProcess.stderr?.on('data', data =>
      this.stdOutEventEmitter.fire(getOutput(data))
    )
    childProcess.on('close', () => this.completedEventEmitter.fire())
    this.currentProcess = childProcess
  }

  public async run(command: Commands, cwd: string) {
    await this.pseudoTerminal.openCurrentInstance()
    if (!this.pseudoTerminal.isBlocked) {
      return this.startProcess(command, cwd)
    }
    window.showErrorMessage(
      `Cannot start ${command} as the output terminal is already occupied`
    )
  }

  public stop() {
    return this.terminatedEventEmitter.fire()
  }

  public isRunning() {
    return !!this.currentProcess
  }

  constructor(config: Config) {
    this.config = config

    this.completedEventEmitter = this.dispose.track(new EventEmitter<void>())
    this.onDidComplete = this.completedEventEmitter.event
    this.dispose.track(
      this.onDidComplete(() => {
        this.pseudoTerminal.setBlocked(false)
        this.stdOutEventEmitter.fire(
          '\r\nTerminal will be reused by DVC, press any key to close it\r\n\n'
        )
        this.currentProcess = undefined
      })
    )

    this.stdOutEventEmitter = this.dispose.track(new EventEmitter<string>())

    this.startedEventEmitter = this.dispose.track(new EventEmitter<void>())

    this.terminatedEventEmitter = this.dispose.track(new EventEmitter<void>())
    this.onDidTerminate = this.terminatedEventEmitter.event
    this.dispose.track(
      this.onDidTerminate(() => {
        this.currentProcess?.kill()
        this.completedEventEmitter.fire()
      })
    )

    this.pseudoTerminal = this.dispose.track(
      new PseudoTerminal(this.stdOutEventEmitter, this.terminatedEventEmitter)
    )
  }
}
