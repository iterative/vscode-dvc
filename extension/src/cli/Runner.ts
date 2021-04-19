import { EventEmitter, Event, window } from 'vscode'
import { Config } from '../Config'
import { Disposable } from '@hediet/std/disposable'
import { PseudoTerminal } from '../PseudoTerminal'
import { Commands } from './commands'
import { executeInShell } from './shellExecution'

export class Runner {
  public readonly dispose = Disposable.fn()

  private blocked: boolean

  private stdOutEventEmitter: EventEmitter<string>
  private completedEventEmitter: EventEmitter<void>
  private startedEventEmitter: EventEmitter<void>

  private onDidStart: Event<void>
  private onDidComplete: Event<void>

  private pseudoTerminal: PseudoTerminal
  private config: Config

  public async run(command: Commands, cwd: string) {
    if (!this.blocked || !this.pseudoTerminal.isOpen) {
      this.blocked = true
      await this.pseudoTerminal.openCurrentInstance()
      this.stdOutEventEmitter.fire(`Running: dvc ${command}\r\n\n`)
      return executeInShell({
        config: this.config,
        command,
        cwd,
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

  constructor(config: Config) {
    this.blocked = false

    this.config = config

    this.completedEventEmitter = this.dispose.track(new EventEmitter<void>())
    this.onDidComplete = this.completedEventEmitter.event
    this.dispose.track(
      this.onDidComplete(() => {
        this.blocked = false
        this.stdOutEventEmitter.fire(
          '\r\nTerminal will be reused by DVC, press any key to close it\r\n\n'
        )
      })
    )

    this.stdOutEventEmitter = this.dispose.track(new EventEmitter<string>())

    this.startedEventEmitter = this.dispose.track(new EventEmitter<void>())
    this.onDidStart = this.startedEventEmitter.event
    this.dispose.track(this.onDidStart(() => (this.blocked = true)))

    this.pseudoTerminal = this.dispose.track(
      new PseudoTerminal(this.stdOutEventEmitter)
    )
  }
}
