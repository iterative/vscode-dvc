import { describe, it } from 'mocha'
import chai from 'chai'
import { spy, stub } from 'sinon'
import sinonChai from 'sinon-chai'
import { window } from 'vscode'
import * as shellExecuter from '../../../cli/shellExecution'
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
      const stubbedGetCommand = stub(shellExecuter, 'getCommand').returns(
        'sleep 3'
      )

      const firstRun = runner.run(Commands.STATUS, __dirname)
      const secondRun = runner.run(Commands.STATUS, __dirname)

      await firstRun
      expect(stubbedGetCommand).to.be.called
      await secondRun
      stubbedGetCommand.restore()
      expect(windowErrorMessageSpy).to.be.called
      disposable.dispose()
    }).timeout(6000)
  })
})
