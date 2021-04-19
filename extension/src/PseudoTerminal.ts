import { EventEmitter, Pseudoterminal, Terminal, window } from 'vscode'
export class PseudoTerminal {
  private termName: string
  private instance: Terminal | undefined
  public writeEmitter: EventEmitter<string>

  public openCurrentInstance = async (): Promise<Terminal | undefined> => {
    if (!this.instance) {
      await this.initializeInstance()
    }
    this.instance?.show(true)
    return this.instance
  }

  public dispose = (): void => {
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
        onDidWrite: this.writeEmitter.event,
        open: () => {
          this.writeEmitter.fire('>>>> DVC Terminal >>>>\r\n\n')
          resolve()
        },
        close: () => {},
        handleInput: data =>
          this.writeEmitter.fire(data === '\r' ? '\r\n' : data)
      }

      this.instance = window.createTerminal({
        name: this.termName,
        pty
      })
    })

  constructor() {
    this.termName = 'DVC'
    this.writeEmitter = new EventEmitter<string>()
  }
}
