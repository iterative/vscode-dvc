import { describe, it } from 'mocha'
import chai from 'chai'
import { spy, stub } from 'sinon'
import sinonChai from 'sinon-chai'
import { window } from 'vscode'
import * as Execution from '../../../cli/execution'
import { Commands } from '../../../cli/commands'
import { Disposable } from '../../../extension'
import { Config } from '../../../Config'
import { Runner } from '../../../cli/Runner'

chai.use(sinonChai)
const { expect } = chai

suite('Runner Test Suite', () => {
  window.showInformationMessage('Start all runner tests.')

  describe('Runner', () => {
    it('should only be able to run a single command at a time', async () => {
      const disposable = Disposable.fn()
      const runner = disposable.track(new Runner({} as Config))

      const windowErrorMessageSpy = spy(window, 'showErrorMessage')
      const cwd = __dirname
      const stubbedGetExecutionDetails = stub(
        Execution,
        'getExecutionDetails'
      ).returns({
        executable: 'sleep',
        cwd,
        env: {}
      })

      await runner.run(cwd, '3')
      await runner.run(cwd, Commands.CHECKOUT)
      stubbedGetExecutionDetails.restore()

      expect(stubbedGetExecutionDetails).to.be.calledWith({
        cliPath: undefined,
        cwd,
        pythonBinPath: undefined
      })
      expect(stubbedGetExecutionDetails).to.be.calledOnce

      expect(windowErrorMessageSpy).to.be.calledOnce
      disposable.dispose()
    }).timeout(6000)

    it('should be able to stop a started command', async () => {
      const disposable = Disposable.fn()
      const runner = disposable.track(new Runner({} as Config))
      const cwd = __dirname
      const stubbedGetExecutionDetails = stub(
        Execution,
        'getExecutionDetails'
      ).returns({
        executable: 'sleep',
        cwd,
        env: {}
      })

      const processCompletedEvent = (): Promise<void> =>
        new Promise(resolve =>
          disposable.track(runner.onDidComplete(() => resolve()))
        )

      await runner.run(cwd, '100000000000000000000000')
      stubbedGetExecutionDetails.restore()

      const completedEvent = processCompletedEvent()

      expect(runner.isRunning()).to.be.true

      const stopped = await runner.stop()
      expect(stopped).to.be.true

      await completedEvent

      expect(runner.isRunning()).to.be.false
      disposable.dispose()
    })
  })
})
