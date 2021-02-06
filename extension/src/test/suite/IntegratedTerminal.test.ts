import { describe, it } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { window } from 'vscode'
import { IntegratedTerminal } from '../../IntegratedTerminal'
import { delay } from '../../util'
import { Disposable } from '../../extension'

chai.use(sinonChai)
const { expect } = chai

suite('Integrated Terminal Test Suite', () => {
  window.showInformationMessage('Start all integrated terminal tests.')

  const waitForAndDispose = async (
    disposable: Disposable,
    ms = 1000
  ): Promise<void> => {
    await delay(ms)
    disposable.dispose()
    await delay(ms)
  }

  describe('IntegratedTerminal', () => {
    it('should be able to open a terminal', async () => {
      const disposable = Disposable.fn()

      let eventCount = 0
      disposable.track(
        window.onDidOpenTerminal(event => {
          eventCount += 1
          expect(event.creationOptions?.name).to.equal('DVC')
        })
      )
      disposable.track(IntegratedTerminal)

      await IntegratedTerminal.openCurrentInstance()
      await waitForAndDispose(disposable)

      expect(eventCount).to.equal(1)
    }).timeout(20000)

    it('should be able to run a command', async () => {
      const disposable = Disposable.fn()
      const text = 'some-really-long-string'
      let eventStream = ''
      disposable.track(
        window.onDidWriteTerminalData(event => {
          eventStream += event.data
        })
      )
      disposable.track(IntegratedTerminal)

      await IntegratedTerminal.run('echo ' + text)
      await waitForAndDispose(disposable)

      expect(eventStream.includes(text)).to.be.true
    }).timeout(12000)

    it('should be able to run multiple commands in the same terminal', async () => {
      const disposable = Disposable.fn()
      const firstText = 'some-really-long-string'
      const secondText = ':weeeee:'
      let eventStream = ''
      disposable.track(
        window.onDidWriteTerminalData(event => {
          eventStream += event.data
        })
      )
      disposable.track(IntegratedTerminal)

      await IntegratedTerminal.run('echo ' + firstText)
      await delay(500)
      await IntegratedTerminal.run('echo ' + secondText)
      await waitForAndDispose(disposable)

      expect(eventStream.includes(firstText)).to.be.true
      expect(eventStream.includes(secondText)).to.be.true
      expect(eventStream.indexOf(firstText)).to.be.lessThan(
        eventStream.indexOf(secondText)
      )
    }).timeout(12000)
  })
})
