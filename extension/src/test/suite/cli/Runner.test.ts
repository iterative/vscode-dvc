import { describe, it } from 'mocha'
import chai from 'chai'
import { spy, stub } from 'sinon'
import sinonChai from 'sinon-chai'
import { window } from 'vscode'
import * as ExecutionDetails from '../../../cli/executionDetails'
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
        ExecutionDetails,
        'getExecutionDetails'
      ).returns({
        command: 'sleep 3',
        cwd,
        env: {}
      })

      await runner.run(Commands.STATUS, cwd)
      await runner.run(Commands.CHECKOUT, cwd)
      stubbedGetExecutionDetails.restore()

      expect(stubbedGetExecutionDetails).to.be.calledWith({
        cliPath: undefined,
        command: Commands.STATUS,
        cwd,
        pythonBinPath: undefined
      })
      expect(stubbedGetExecutionDetails).not.to.be.calledWith({
        cliPath: undefined,
        command: Commands.CHECKOUT,
        cwd,
        pythonBinPath: undefined
      })
      expect(windowErrorMessageSpy).to.be.calledOnce
      disposable.dispose()
    }).timeout(6000)

    it('should be able to stop a started command', async () => {
      const disposable = Disposable.fn()
      const runner = disposable.track(new Runner({} as Config))
      const cwd = __dirname
      const stubbedGetExecutionDetails = stub(
        ExecutionDetails,
        'getExecutionDetails'
      ).returns({
        command: 'sleep 10',
        cwd,
        env: {}
      })

      await runner.run(Commands.STATUS, cwd)
      stubbedGetExecutionDetails.restore()

      expect(runner.isRunning()).to.be.true

      runner.stop()

      expect(runner.isRunning()).to.be.false
      disposable.dispose()
    }).timeout(2000)
  })
})
