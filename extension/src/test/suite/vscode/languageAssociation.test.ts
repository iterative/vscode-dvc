import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { commands, MessageItem, Uri, window } from 'vscode'
import { restore, stub } from 'sinon'
import { dvcDemoPath } from '../util'
import { Disposable } from '../../../extension'

suite('Output Channel Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
  })

  describe('tryAssociateYamlOnce', () => {
    it('should only try and associate .dvc and dvc.lock files once per session', async () => {
      const mockShowInformationMessage = stub(
        window,
        'showInformationMessage'
      ).resolves('No' as unknown as MessageItem)

      const getDvcLock = () =>
        window.showTextDocument(Uri.file(join(dvcDemoPath, 'dvc.lock')))

      await getDvcLock()

      expect(
        mockShowInformationMessage,
        'should ask the user if they want to associate .dvc and dvc.lock files with yaml on the first call'
      ).to.be.calledOnce

      await commands.executeCommand('workbench.action.closeAllEditors')

      mockShowInformationMessage.resetHistory()

      await getDvcLock()

      expect(
        mockShowInformationMessage,
        'should not ask the user if they want to associate .dvc and dvc.lock files with yaml on subsequent calls'
      ).not.to.be.called
    })
  })
})
