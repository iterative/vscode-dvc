import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Terminal, TerminalDataWriteEvent, window } from 'vscode'
import { IntegratedTerminal } from '../../IntegratedTerminal'
import { Disposable } from '../../extension'
import { delay } from '../../util'

chai.use(sinonChai)
const { expect } = chai

suite('Integrated Terminal Test Suite', () => {
  window.showInformationMessage('Start all integrated terminal tests.')

  const fullyDispose = (disposable: Disposable) => {
    disposable.dispose()
    return delay(500)
  }

  describe('IntegratedTerminal', () => {
    it('should be able to open a terminal', async () => {
      const disposable = Disposable.fn()

      disposable.track(IntegratedTerminal)
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

      IntegratedTerminal.openCurrentInstance()

      const terminal = await openTerminalEvent()
      expect(terminal.creationOptions?.name).to.equal('DVC')

      return fullyDispose(disposable)
    }).timeout(12000)

    it('should be able to run a command', async () => {
      const disposable = Disposable.fn()
      disposable.track(IntegratedTerminal)

      const text = 'some-really-long-string'

      const terminalDataWriteEventStream = (text: string): Promise<string> => {
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
          disposable.track(listener)
        })
      }

      IntegratedTerminal.run('echo ' + text)

      const eventStream = await terminalDataWriteEventStream(text)
      expect(eventStream.includes(text)).to.be.true

      return fullyDispose(disposable)
    }).timeout(12000)

    it('should be able to run multiple commands in the same terminal', async () => {
      const disposable = Disposable.fn()
      disposable.track(IntegratedTerminal)

      const firstText = 'some-really-long-string'
      const secondText = ':weeeee:'
      const terminalDataWriteEventStream = (text: string): Promise<string> => {
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
          disposable.track(listener)
        })
      }

      const firstEvent = terminalDataWriteEventStream(firstText)
      const secondEvent = terminalDataWriteEventStream(secondText)
      await IntegratedTerminal.run('echo ' + firstText)
      await IntegratedTerminal.run('echo ' + secondText)

      const firstStream = await Promise.race([firstEvent, secondEvent])
      let eventStream = await firstEvent
      expect(firstStream).to.equal(eventStream)

      eventStream += await secondEvent

      expect(eventStream.includes(firstText)).to.be.true
      expect(eventStream.includes(secondText)).to.be.true

      return fullyDispose(disposable)
    }).timeout(12000)
  })
})
