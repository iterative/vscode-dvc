import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { commands } from 'vscode'
import { restore, spy, stub } from 'sinon'
import { closeAllEditors } from '../util'
import { RegisteredCommands } from '../../../commands/external'
import { buildMockMemento } from '../../util'
import {
  MementoKey,
  showWalkthroughOnFirstUse
} from '../../../vscode/walkthrough'

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

  describe('showWalkthroughOnFirstUse', () => {
    it('should only show the walkthrough once', () => {
      const mockGlobalState = buildMockMemento()

      const mockExecuteCommand = stub(commands, 'executeCommand').resolves(
        undefined
      )

      expect(mockGlobalState.get(MementoKey)).to.equal(undefined)

      showWalkthroughOnFirstUse(mockGlobalState)

      expect(mockExecuteCommand).to.be.calledOnce
      expect(mockGlobalState.get(MementoKey)).to.equal(true)

      mockExecuteCommand.resetHistory()

      showWalkthroughOnFirstUse(mockGlobalState)

      expect(mockExecuteCommand).not.to.be.called
      expect(mockGlobalState.get(MementoKey)).to.equal(true)
    })
  })
})
