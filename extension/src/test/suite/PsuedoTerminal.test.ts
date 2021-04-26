import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { EventEmitter, Terminal, TerminalDataWriteEvent, window } from 'vscode'
import { PseudoTerminal } from '../../PseudoTerminal'
import { Disposable, Disposer } from '../../extension'

chai.use(sinonChai)
const { expect } = chai

suite('Pseudo Terminal Test Suite', () => {
  window.showInformationMessage('Start all pseudo terminal tests.')

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
      const disposable = Disposable.fn()
      const pseudoTerminal = new PseudoTerminal(
        new EventEmitter<string>(),
        new EventEmitter<void>()
      )
      disposable.track(pseudoTerminal)

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
      expect(terminal.creationOptions?.name).to.equal('DVC')

      disposable.dispose()
      return closeTerminalEvent()
    }).timeout(12000)

    it('should be able to handle multiple output events', async () => {
      const outputEventEmitter = new EventEmitter<string>()
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

      const disposable = Disposable.fn()
      const pseudoTerminal = new PseudoTerminal(
        outputEventEmitter,
        new EventEmitter<void>()
      )
      disposable.track(pseudoTerminal)

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

      disposable.dispose()
      return closeTerminalEvent()
    }).timeout(12000)
  })
})
