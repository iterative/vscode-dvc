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
      const echoString = 'echo some-really-long-string'
      let eventStream = ''
      disposable.track(
        window.onDidWriteTerminalData(event => {
          eventStream += event.data
        })
      )
      disposable.track(IntegratedTerminal)

      await IntegratedTerminal.run(echoString)
      await waitForAndDispose(disposable)

      expect(eventStream.includes(echoString)).to.be.true
    }).timeout(12000)

    it('should be able to run multiple commands in the same terminal', async () => {
      const disposable = Disposable.fn()
      workspace.getConfiguration().update('python.pythonPath', undefined)
      const firstEchoString = 'echo some-really-long-string'
      const secondEchoString = 'echo :weeeee:'
      let eventStream = ''
      disposable.track(
        window.onDidWriteTerminalData(event => {
          eventStream += event.data
        })
      )
      disposable.track(IntegratedTerminal)

      await IntegratedTerminal.run(firstEchoString)
      await IntegratedTerminal.run(secondEchoString)
      await waitForAndDispose(disposable)

      expect(eventStream.includes(firstEchoString)).to.be.true
      expect(eventStream.includes(secondEchoString)).to.be.true
      expect(eventStream.indexOf(firstEchoString)).to.be.lessThan(
        eventStream.indexOf(secondEchoString)
      )
    }).timeout(12000)

    it('should be able to run a command after the python environment is initialized', async () => {
      const disposable = Disposable.fn()
      const envFolder = '.env/bin/'
      workspace
        .getConfiguration()
        .update('python.pythonPath', envFolder + 'python3.9')
      const echoString = 'echo some-different-long-string'
      let eventStream = ''
      disposable.track(
        window.onDidWriteTerminalData(event => {
          eventStream += event.data
        })
      )
      disposable.track(IntegratedTerminal)

      await IntegratedTerminal.run(echoString)
      await waitForAndDispose(disposable)

      expect(eventStream.includes(envFolder)).to.be.true
      expect(eventStream.includes(echoString)).to.be.true
      expect(eventStream.indexOf(envFolder)).to.be.lessThan(
        eventStream.indexOf(echoString)
      )
    }).timeout(12000)
  })
})
