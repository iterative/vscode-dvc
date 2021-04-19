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
      const stubbedGetCommand = stub(ExecutionDetails, 'getCommand').returns(
        'sleep 3'
      )

      const firstRun = runner.run(Commands.STATUS, __dirname)
      const secondRun = runner.run(Commands.CHECKOUT, __dirname)

      await firstRun
      await secondRun
      stubbedGetCommand.restore()

      expect(stubbedGetCommand).to.be.calledWith(Commands.STATUS, undefined)
      expect(stubbedGetCommand).not.to.be.calledWith(
        Commands.CHECKOUT,
        undefined
      )
      expect(windowErrorMessageSpy).to.be.called
      disposable.dispose()
    }).timeout(6000)

    it('should be able to stop a started command', async () => {
      const disposable = Disposable.fn()
      const runner = disposable.track(new Runner({} as Config))

      const stubbedGetCommand = stub(ExecutionDetails, 'getCommand').returns(
        'sleep 10'
      )

      await runner.run(Commands.STATUS, __dirname)
      stubbedGetCommand.restore()

      expect(runner.isRunning()).to.be.true

      runner.stop()

      expect(runner.isRunning()).to.be.false
      disposable.dispose()
    }).timeout(2000)
  })
})
