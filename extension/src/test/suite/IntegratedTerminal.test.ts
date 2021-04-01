import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Terminal, TerminalDataWriteEvent, window } from 'vscode'
import { IntegratedTerminal } from '../../IntegratedTerminal'
import { Disposable, Disposer } from '../../extension'

chai.use(sinonChai)
const { expect } = chai

suite('Integrated Terminal Test Suite', () => {
  window.showInformationMessage('Start all integrated terminal tests.')

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

  describe('IntegratedTerminal', () => {
    it('should be able to open a terminal', async () => {
      const disposable = Disposable.fn()
      disposable.track(IntegratedTerminal)

      IntegratedTerminal.openCurrentInstance()

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

    it('should be able to run a command', async () => {
      const disposable = Disposable.fn()
      disposable.track(IntegratedTerminal)

      const text = 'some-really-long-string'

      IntegratedTerminal.run('echo ' + text)

      const eventStream = await terminalDataWriteEventStream(text, disposable)
      expect(eventStream.includes(text)).to.be.true

      disposable.dispose()
      return closeTerminalEvent()
    }).timeout(12000)

    it('should be able to run multiple commands in the same terminal', async () => {
      const disposable = Disposable.fn()
      disposable.track(IntegratedTerminal)

      const firstText = 'some-really-long-string'
      const secondText = ':weeeee:'

      const firstEvent = terminalDataWriteEventStream(firstText, disposable)
      const secondEvent = terminalDataWriteEventStream(secondText, disposable)
      await IntegratedTerminal.run('echo ' + firstText)
      await IntegratedTerminal.run('echo ' + secondText)

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
