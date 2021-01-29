import { describe, it, before } from 'mocha'
import * as chai from 'chai'
import * as sinonChai from 'sinon-chai'
import { window, workspace } from 'vscode'
import { IntegratedTerminal } from '../../IntegratedTerminal'
import { delay } from '../../util'
import { Disposable } from '../../extension'

chai.use(sinonChai)
const { expect } = chai

suite('Integrated Terminal Test Suite', () => {
  window.showInformationMessage('Start all integrated terminal tests.')

  const waitForAndDispose = async (disposable: Disposable): Promise<void> => {
    await delay(1000)
    disposable.dispose()
    await delay(1000)
  }

  before(async () => {
    workspace.getConfiguration().update('python.pythonPath', undefined, true)
  })

  describe('IntegratedTerminal', () => {
    it('should be able to open a terminal', async () => {
      const disposable = Disposable.fn()

      workspace.getConfiguration().update('python.pythonPath', undefined)
      let eventCount = 0
      disposable.track(
        window.onDidOpenTerminal(event => {
          eventCount += 1
          expect(event.creationOptions?.name).to.equal('DVC')
        })
      )
      disposable.track(IntegratedTerminal)

      await IntegratedTerminal._createTerminal()
      await waitForAndDispose(disposable)

      expect(eventCount).to.equal(1)
    }).timeout(12000)

    it('should be able to run a command', async () => {
      const disposable = Disposable.fn()
      workspace.getConfiguration().update('python.pythonPath', undefined)
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
      console.error(eventStream)

      expect(eventStream.includes(text)).to.be.true
    }).timeout(12000)

    it('should be able to run multiple commands in the same terminal', async () => {
      const disposable = Disposable.fn()
      workspace.getConfiguration().update('python.pythonPath', undefined)
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
      await IntegratedTerminal.run('echo ' + secondText)
      await waitForAndDispose(disposable)
      console.error(eventStream)

      expect(eventStream.includes(firstText)).to.be.true
      expect(eventStream.includes(secondText)).to.be.true
      expect(eventStream.indexOf(firstText)).to.be.lessThan(
        eventStream.indexOf(secondText)
      )
    }).timeout(12000)

    it('should be able to run a command after the python environment is initialized', async () => {
      const disposable = Disposable.fn()
      const envFolder = '.env/bin/'
      workspace
        .getConfiguration()
        .update('python.pythonPath', envFolder + 'python3.9')
      workspace
        .getConfiguration()
        .update('python.terminal.activateEnvInCurrentTerminal', true)

      console.error(
        workspace.getConfiguration().get('python.pythonPath'),
        workspace
          .getConfiguration()
          .get('python.terminal.activateEnvInCurrentTerminal')
      )

      const text = 'some-different-long-string'
      let eventStream = ''
      disposable.track(
        window.onDidWriteTerminalData(event => {
          eventStream += event.data
        })
      )
      disposable.track(IntegratedTerminal)

      await IntegratedTerminal.run('echo ' + text)
      await waitForAndDispose(disposable)
      console.error(eventStream)

      expect(eventStream.includes(envFolder)).to.be.true
      expect(eventStream.includes(text)).to.be.true
      expect(eventStream.indexOf(envFolder)).to.be.lessThan(
        eventStream.indexOf(text)
      )
    }).timeout(12000)
  })
})
