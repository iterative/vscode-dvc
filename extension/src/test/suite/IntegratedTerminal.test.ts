import { describe, it, before } from 'mocha'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import { window, workspace } from 'vscode'
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

  const envFolder = '.env/bin/'

  before(async () => {
    workspace
      .getConfiguration()
      .update('python.pythonPath', envFolder + 'python3.9', false)
    workspace
      .getConfiguration()
      .update('python.terminal.activateEnvironment', true, false)
    return delay(1000)
  })

  describe('IntegratedTerminal', () => {
    it('should be able to run multiple commands in the same terminal after the python environment is initialized', async () => {
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

      expect(eventStream.includes(envFolder)).to.be.true
      expect(eventStream.includes(firstText)).to.be.true
      expect(eventStream.indexOf(envFolder)).to.be.lessThan(
        eventStream.indexOf(firstText)
      )
      expect(eventStream.includes(firstText)).to.be.true
      expect(eventStream.includes(secondText)).to.be.true
      expect(eventStream.indexOf(firstText)).to.be.lessThan(
        eventStream.indexOf(secondText)
      )
    }).timeout(20000)
  })
})
