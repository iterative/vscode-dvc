import { EventEmitter, Pseudoterminal, Terminal, window } from 'vscode'
import { Disposable } from '@hediet/std/disposable'

export class PseudoTerminal {
  public dispose = Disposable.fn()

  private termName: string
  private instance: Terminal | undefined

  private blocked: boolean

  public isBlocked() {
    return this.blocked
  }

  public setBlocked(blocked: boolean) {
    this.blocked = blocked
  }

  private readonly processOutput: EventEmitter<string>
  private readonly processTerminated: EventEmitter<void>

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
        close: () => {
          this.processTerminated.fire()
          this.setBlocked(false)
        },
        handleInput: data => {
          if (!this.isBlocked() && data) {
            this.close()
          }
        },
        onDidWrite: this.processOutput.event,
        open: () => {
          this.processOutput.fire('>>>> DVC Terminal >>>>\r\n\n')
          resolve()
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
    processOutput: EventEmitter<string>,
    processTerminated: EventEmitter<void>,
    termName = 'DVC'
  ) {
    this.termName = termName
    this.processOutput = processOutput
    this.processTerminated = processTerminated
    this.blocked = false
  }
}
