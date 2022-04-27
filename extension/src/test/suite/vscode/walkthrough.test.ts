import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { commands } from 'vscode'
import { restore, spy } from 'sinon'
import { closeAllEditors } from '../util'
import { RegisteredCommands } from '../../../commands/external'

suite('Walkthrough Test Suite', () => {
  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    return closeAllEditors()
  })

  describe('dvc.getStarted', () => {
    it('should be able to show the walkthrough', async () => {
      const executeCommandSpy = spy(commands, 'executeCommand')

      await expect(
        commands.executeCommand(RegisteredCommands.EXTENSION_GET_STARTED)
      ).to.be.eventually.equal(undefined)

      expect(executeCommandSpy).to.be.calledTwice
      expect(executeCommandSpy).to.be.calledWith(
        'workbench.action.openWalkthrough',
        'iterative.dvc#welcome'
      )
    })
  })
})
