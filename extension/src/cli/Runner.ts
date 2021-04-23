import { EventEmitter, Event, window } from 'vscode'
import { ChildProcess } from 'child_process'
import { Disposable } from '@hediet/std/disposable'
import { Config } from '../Config'
import { PseudoTerminal } from '../PseudoTerminal'
import { Commands } from './commands'
import { executeInShell, ProcessCompletedEvent } from './shellExecution'

export class Runner {
  public readonly dispose = Disposable.fn()

  private outputEventEmitter: EventEmitter<string>
  private completedEventEmitter: EventEmitter<ProcessCompletedEvent>
  private startedEventEmitter: EventEmitter<void>
  private terminatedEventEmitter: EventEmitter<void>

  private onDidComplete: Event<ProcessCompletedEvent>
  public onDidTerminate: Event<void>

  private pseudoTerminal: PseudoTerminal
  private currentProcess: ChildProcess | undefined
  private config: Config

  private async startProcess(command: Commands, cwd: string) {
    this.pseudoTerminal.setBlocked(true)
    this.outputEventEmitter.fire(`Running: dvc ${command}\r\n\n`)
    this.currentProcess = await executeInShell({
      options: {
        cliPath: this.config.dvcPath,
        command,
        cwd,
        pythonBinPath: this.config.pythonBinPath
      },
      emitters: {
        completedEventEmitter: this.completedEventEmitter,
        startedEventEmitter: this.startedEventEmitter,
        stdOutEventEmitter: this.outputEventEmitter,
        stdErrEventEmitter: this.outputEventEmitter
      }
    })
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

    this.completedEventEmitter = this.dispose.track(
      new EventEmitter<ProcessCompletedEvent>()
    )
    this.onDidComplete = this.completedEventEmitter.event
    this.dispose.track(
      this.onDidComplete(({ code, signal }) => {
        this.pseudoTerminal.setBlocked(false)
        const exitString = [
          'Process completed',
          code !== null && `with code ${code}`,
          signal !== null && `after ${signal}`
        ]
          .filter(Boolean)
          .join(' ')
        this.outputEventEmitter.fire(
          `\r\n${exitString}\r\nTerminal will be reused by DVC, press any key to close it\r\n\n`
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
        this.currentProcess?.kill('SIGINT')
      })
    )

    this.pseudoTerminal = this.dispose.track(
      new PseudoTerminal(this.outputEventEmitter, this.terminatedEventEmitter)
    )
  }
}
