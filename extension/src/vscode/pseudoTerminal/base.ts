import { EventEmitter, Pseudoterminal, Terminal, window } from 'vscode'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { Disposable } from '../../class/dispose'

export class BasePseudoTerminal extends Disposable {
  protected instance: Terminal | undefined
  protected readonly processOutput: EventEmitter<string>

  private readonly termName: string

  private blocked: boolean

  private readonly processTerminated: EventEmitter<string>

  private isActive = false

  constructor(
    processOutput: EventEmitter<string>,
    processTerminated: EventEmitter<string>,
    termName = 'DVC'
  ) {
    super()

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

  public close() {
    const currentTerminal = this.instance
    if (currentTerminal) {
      currentTerminal.dispose()
    }
  }

  protected createInstance() {
    return new Promise<void>(resolve => {
      const pty: Pseudoterminal = {
        close: () => {
          this.processTerminated.fire(this.termName)
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
  }

  private deleteReferenceOnClose() {
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
