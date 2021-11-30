import { EventEmitter, Pseudoterminal, Terminal, window } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { sendTelemetryEvent } from '../telemetry'
import { EventName } from '../telemetry/constants'

export class PseudoTerminal {
  public readonly dispose = Disposable.fn()

  private readonly termName: string
  private instance: Terminal | undefined

  private blocked: boolean

  private readonly processOutput: EventEmitter<string>
  private readonly processTerminated: EventEmitter<void>

  private isActive = false

  constructor(
    processOutput: EventEmitter<string>,
    processTerminated: EventEmitter<void>,
    termName = 'DVC'
  ) {
    this.termName = termName
    this.processOutput = processOutput
    this.processTerminated = processTerminated
    this.blocked = false

    this.deleteReferenceOnClose()

    this.notifyActiveStatus()
  }

  public isBlocked() {
    return this.blocked
  }

  public setBlocked(blocked: boolean) {
    this.blocked = blocked
  }

  public openCurrentInstance = async (): Promise<Terminal | undefined> => {
    if (!this.instance) {
      await this.createInstance()
    }
    this.instance?.show(true)
    return this.instance
  }

  public close = (): void => {
    const currentTerminal = this.instance
    if (currentTerminal) {
      currentTerminal.dispose()
    }
  }

  private deleteReferenceOnClose = (): void => {
    this.dispose.track(
      window.onDidCloseTerminal(event => {
        if (this.instance && event.name === this.termName) {
          this.dispose.untrack(this.instance)
          this.instance = undefined

          sendTelemetryEvent(
            EventName.VIEWS_TERMINAL_CLOSED,
            undefined,
            undefined
          )
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

          sendTelemetryEvent(
            EventName.VIEWS_TERMINAL_CREATED,
            undefined,
            undefined
          )

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

  private notifyActiveStatus() {
    this.dispose.track(
      window.onDidChangeActiveTerminal(term => {
        if (this.isActive && term?.name !== this.termName) {
          this.isActive = false
          return this.sendFocusChangedTelemetryEvent()
        }
        if (term && !this.isActive && term.name === this.termName) {
          this.isActive = true
          return this.sendFocusChangedTelemetryEvent()
        }
      })
    )
  }

  private sendFocusChangedTelemetryEvent() {
    return sendTelemetryEvent(
      EventName.VIEWS_TERMINAL_FOCUS_CHANGED,
      {
        active: this.isActive
      },
      undefined
    )
  }
}
