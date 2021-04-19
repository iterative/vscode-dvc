import { EventEmitter, Pseudoterminal, Terminal, window } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { Deferred } from '@hediet/std/synchronization'

export class PseudoTerminal {
  public dispose = Disposable.fn()

  private readonly _initialized = new Deferred()
  private readonly initialized = this._initialized.promise

  public get ready() {
    return this.initialized
  }

  private termName: string
  private instance: Terminal | undefined

  private readonly stdOutEventEmitter: EventEmitter<string>

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

  private initializeInstance = async (): Promise<void> => {
    this.deleteReferenceOnClose()
    return this.createInstance()
  }

  private deleteReferenceOnClose = (): void => {
    window.onDidCloseTerminal(async event => {
      if (this.instance && event.name === this.termName) {
        this.instance = undefined
      }
    })
  }

  private createInstance = async (): Promise<void> =>
    new Promise<void>(resolve => {
      const pty: Pseudoterminal = {
        onDidWrite: this.stdOutEventEmitter.event,
        open: () => {
          this.stdOutEventEmitter.fire('>>>> DVC Terminal >>>>\r\n\n')
          resolve()
        },
        close: () => {},
        handleInput: data =>
          this.stdOutEventEmitter.fire(data === '\r' ? '\r\n' : data)
      }

      this.instance = this.dispose.track(
        window.createTerminal({
          name: this.termName,
          pty
        })
      )
    })

  constructor(stdOutEventEmitter: EventEmitter<string>) {
    this.termName = 'DVC'
    this.stdOutEventEmitter = stdOutEventEmitter

    this.openCurrentInstance().then(() => this._initialized.resolve())
  }
}
