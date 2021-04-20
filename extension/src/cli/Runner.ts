import { EventEmitter, Event, window } from 'vscode'
import { ChildProcess } from 'child_process'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../Config'
import { PseudoTerminal } from '../PseudoTerminal'
import { Commands } from './commands'
import { executeInShell } from './shellExecution'

export class Runner {
  public readonly dispose = Disposable.fn()

  private stdOutEventEmitter: EventEmitter<string>
  private completedEventEmitter: EventEmitter<void>
  private startedEventEmitter: EventEmitter<void>
  private terminatedEventEmitter: EventEmitter<void>

  private onDidComplete: Event<void>
  private onDidStart: Event<void>
  public onDidTerminate: Event<void>

  private pseudoTerminal: PseudoTerminal
  private currentProcess: ChildProcess | undefined
  private config: Config

  public async run(command: Commands, cwd: string) {
    await this.pseudoTerminal.openCurrentInstance()
    if (!this.pseudoTerminal.isBlocked) {
      this.stdOutEventEmitter.fire(`Running: dvc ${command}\r\n\n`)
      this.currentProcess = await executeInShell({
        options: {
          pythonBinPath: this.config.pythonBinPath,
          cliPath: this.config.dvcPath,
          cwd,
          command
        },
        emitters: {
          completedEventEmitter: this.completedEventEmitter,
          stdOutEventEmitter: this.stdOutEventEmitter,
          startedEventEmitter: this.startedEventEmitter
        }
      })
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
    this.onDidStart = this.startedEventEmitter.event
    this.dispose.track(
      this.onDidStart(() => {
        this.pseudoTerminal.setBlocked(true)
      })
    )

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
