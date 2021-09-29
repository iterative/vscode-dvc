import { describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { commands } from 'vscode'
import { stub } from 'sinon'
import { RegisteredCommands } from '../../../commands/external'
import { buildMockMemento } from '../../util'
import {
  MementoKey,
  showWalkthroughOnFirstUse
} from '../../../vscode/walkthrough'

suite('Walkthrough Test Suite', () => {
  describe('dvc.getStarted', () => {
    it('should be able to show the walkthrough', async () => {
      await expect(
        commands.executeCommand(RegisteredCommands.EXTENSION_GET_STARTED)
      ).to.be.eventually.equal(undefined)
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
