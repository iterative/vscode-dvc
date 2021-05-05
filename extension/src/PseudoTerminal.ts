import {
  EventEmitter,
  Pseudoterminal,
  Terminal,
  window,
  commands
} from 'vscode'
import { Disposable } from '@hediet/std/disposable'

export class PseudoTerminal {
  private static contextKey = 'dvc.runner.running'
  private setRunningContext = (isRunning: boolean) =>
    commands.executeCommand('setContext', PseudoTerminal.contextKey, isRunning)

  public dispose = Disposable.fn()

  private termName: string
  private instance: Terminal | undefined

  private blocked: boolean

  public get isBlocked() {
    return this.blocked
  }

  public setBlocked(blocked: boolean) {
    this.blocked = blocked
    this.setRunningContext(blocked)
  }

  private readonly outputEventEmitter: EventEmitter<string>
  private readonly terminatedEventEmitter: EventEmitter<void>

  public openCurrentInstance = async (): Promise<Terminal | undefined> => {
    if (!this.instance) {
      await this.initializeInstance()
    }
    this.instance?.show(true)
    return this.instance
  }

  public close = (): void => {
    const currentTerminal = this.instance
    if (currentTerminal) {
      currentTerminal.dispose()
      this.instance = undefined
    }
  }

  private initializeInstance = (): Promise<void> => {
    this.deleteReferenceOnClose()
    return this.createInstance()
  }

  private deleteReferenceOnClose = (): void => {
    this.dispose.track(
      window.onDidCloseTerminal(event => {
        if (this.instance && event.name === this.termName) {
          this.dispose.untrack(this.instance)
          this.instance = undefined
        }
      })
    )
  }

  private createInstance = (): Promise<void> =>
    new Promise<void>(resolve => {
      const pty: Pseudoterminal = {
        onDidWrite: this.outputEventEmitter.event,
        open: () => {
          this.outputEventEmitter.fire('>>>> DVC Terminal >>>>\r\n\n')
          resolve()
        },
        close: () => {
          this.terminatedEventEmitter.fire()
          this.setBlocked(false)
        },
        handleInput: data => {
          if (!this.isBlocked && data) {
            this.close()
          }
        }
      }

      this.instance = this.dispose.track(
        window.createTerminal({
          name: this.termName,
          pty
        })
      )
    })

  constructor(
    outputEventEmitter: EventEmitter<string>,
    terminatedEventEmitter: EventEmitter<void>,
    termName = 'DVC'
  ) {
    this.termName = termName
    this.outputEventEmitter = outputEventEmitter
    this.terminatedEventEmitter = terminatedEventEmitter
    this.blocked = false
  }
}
