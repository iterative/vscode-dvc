import { describe, it } from 'mocha'
import chai from 'chai'
import { stub } from 'sinon'
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
    it("should be able to run a single command and send the ouput to it's pseudoTerminal", async () => {
      const disposable = Disposable.fn()
      const runner = disposable.track(new Runner({} as Config))

      const stubbedGetCommand = stub(shellExecuter, 'getCommand').returns(
        'echo tessssssst'
      )

      const x = await runner.run(Commands.STATUS, __dirname)

      expect(x).not.to.throw
      expect(stubbedGetCommand).to.be.called
      disposable.dispose()
    })
  })
})
