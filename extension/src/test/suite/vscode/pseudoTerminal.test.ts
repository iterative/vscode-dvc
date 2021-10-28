import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { EventEmitter, Terminal, TerminalDataWriteEvent, window } from 'vscode'
import { restore } from 'sinon'
import { Disposable, Disposer } from '../../../extension'
import { PseudoTerminal } from '../../../vscode/pseudoTerminal'

suite('Pseudo Terminal Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  const closeTerminalEvent = (): Promise<Terminal> => {
    return new Promise(resolve => {
      const listener: Disposable = window.onDidCloseTerminal(
        (event: Terminal) => {
          listener.dispose()
          return resolve(event)
        }
      )
    })
  }

  describe('PseudoTerminal', () => {
    it('should be able to open a terminal', async () => {
      const terminalName = 'Open Test Terminal'

      const pseudoTerminal = disposable.track(
        new PseudoTerminal(
          disposable.track(new EventEmitter<string>()),
          disposable.track(new EventEmitter<void>()),
          terminalName
        )
      )

      pseudoTerminal.openCurrentInstance()

      const openTerminalEvent = (): Promise<Terminal> => {
        return new Promise(resolve => {
          const listener: Disposable = window.onDidOpenTerminal(
            (event: Terminal) => {
              return resolve(event)
            }
          )
          disposable.track(listener)
        })
      }

      const terminal = await openTerminalEvent()
      expect(terminal.creationOptions?.name).to.equal(terminalName)

      pseudoTerminal.dispose()

      return closeTerminalEvent()
    })

    it('should be able to handle multiple output events', async () => {
      const disposable = Disposable.fn()
      const outputEventEmitter = disposable.track(new EventEmitter<string>())
      const terminalDataWriteEventStream = (
        text: string,
        disposer: Disposer
      ): Promise<string> => {
        let eventStream = ''
        return new Promise(resolve => {
          const listener: Disposable = window.onDidWriteTerminalData(
            (event: TerminalDataWriteEvent) => {
              eventStream += event.data
              if (eventStream.includes(text)) {
                return resolve(eventStream)
              }
            }
          )
          disposer.track(listener)
        })
      }

      const pseudoTerminal = disposable.track(
        new PseudoTerminal(
          outputEventEmitter,
          disposable.track(new EventEmitter<void>()),
          'Output Test Terminal'
        )
      )

      await pseudoTerminal.openCurrentInstance()
      const firstText = 'some-really-long-string'
      const secondText = ':weeeee:'

      const firstEvent = terminalDataWriteEventStream(firstText, disposable)
      const secondEvent = terminalDataWriteEventStream(secondText, disposable)
      outputEventEmitter.fire('echo ' + firstText)
      outputEventEmitter.fire('echo ' + secondText)

      const firstStream = await Promise.race([firstEvent, secondEvent])
      let eventStream = await firstEvent
      expect(firstStream).to.equal(eventStream)

      eventStream += await secondEvent

      expect(eventStream.includes(firstText)).to.be.true
      expect(eventStream.includes(secondText)).to.be.true

      pseudoTerminal.dispose()

      return closeTerminalEvent()
    })
  })
})
