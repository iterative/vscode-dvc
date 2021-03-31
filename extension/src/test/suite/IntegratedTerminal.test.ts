import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { Terminal, TerminalDataWriteEvent, window } from 'vscode'
import { IntegratedTerminal } from '../../IntegratedTerminal'
import { Disposable } from '../../extension'

chai.use(sinonChai)
const { expect } = chai

suite('Integrated Terminal Test Suite', () => {
  window.showInformationMessage('Start all integrated terminal tests.')

  describe('IntegratedTerminal', () => {
    it('should be able to open a terminal', async () => {
      const disposable = Disposable.fn()

      const openTerminalPromise = (): Promise<Terminal> => {
        return new Promise(resolve => {
          const listener: Disposable = window.onDidOpenTerminal(
            (event: Terminal) => {
              return resolve(event)
            }
          )
          disposable.track(listener)
        })
      }

      const event = openTerminalPromise()

      await IntegratedTerminal.openCurrentInstance()

      const terminal = await event
      expect(terminal.creationOptions?.name).to.equal('DVC')
      disposable.dispose()
    }).timeout(12000)

    it('should be able to run a command', async () => {
      const disposable = Disposable.fn()

      const text = 'some-really-long-string'

      const writeToTerminalPromise = (text: string): Promise<string> => {
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

      const event = writeToTerminalPromise(text)

      IntegratedTerminal.run('echo ' + text)

      const eventStream = await event
      expect(eventStream.includes(text)).to.be.true
      disposable.dispose()
    }).timeout(12000)

    it('should be able to run multiple commands in the same terminal', async () => {
      const disposable = Disposable.fn()
      const firstText = 'some-really-long-string'
      const secondText = ':weeeee:'
      const writeToTerminalPromise = (text: string): Promise<string> => {
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

      const firstEvent = writeToTerminalPromise(firstText)
      const secondEvent = writeToTerminalPromise(secondText)
      await IntegratedTerminal.run('echo ' + firstText)
      await IntegratedTerminal.run('echo ' + secondText)

      const firstStream = await Promise.race([firstEvent, secondEvent])
      let eventStream = await firstEvent
      expect(firstStream).to.equal(eventStream)

      eventStream += await secondEvent

      expect(eventStream.includes(firstText)).to.be.true
      expect(eventStream.includes(secondText)).to.be.true

      disposable.dispose()
    }).timeout(12000)
  })
})
