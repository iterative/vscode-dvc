import { join } from 'path'
import { beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { commands, MessageItem, Uri, window } from 'vscode'
import { restore, stub } from 'sinon'
import { dvcDemoPath } from '../util'
import * as Extensions from '../../../vscode/extensions'

suite('Language Association Test Suite', () => {
  beforeEach(() => {
    restore()
  })

  const openFileInEditor = (fileName: string) =>
    window.showTextDocument(Uri.file(join(dvcDemoPath, fileName)))

  describe('recommendAssociateYamlOnce', () => {
    it('should only try and associate .dvc and dvc.lock files once per session', async () => {
      stub(Extensions, 'isAvailable').resolves(true)
      const mockShowInformationMessage = stub(
        window,
        'showInformationMessage'
      ).resolves('No' as unknown as MessageItem)

      await openFileInEditor('.gitignore')

      expect(
        mockShowInformationMessage,
        'should not ask the user if they want to associate .dvc and dvc.lock files with yaml on a normal editor change'
      ).not.to.be.called

      await openFileInEditor('dvc.lock')

      expect(
        mockShowInformationMessage,
        'should ask the user if they want to associate .dvc and dvc.lock files with yaml on the first call'
      ).to.be.calledOnce

      await commands.executeCommand('workbench.action.closeAllEditors')

      mockShowInformationMessage.resetHistory()

      await openFileInEditor('dvc.lock')

      expect(
        mockShowInformationMessage,
        'should not ask the user if they want to associate .dvc and dvc.lock files with yaml on subsequent calls'
      ).not.to.be.called
    })
  })
})
