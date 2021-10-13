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

  const getUri = (fileName: string) => Uri.file(join(dvcDemoPath, fileName))

  describe('recommendAssociateYamlOnce', () => {
    it('should only try and associate .dvc and dvc.lock files once per session', async () => {
      stub(Extensions, 'isAvailable').resolves(true)
      const mockShowInformationMessage = stub(
        window,
        'showInformationMessage'
      ).resolves('No' as unknown as MessageItem)

      await window.showTextDocument(getUri('.gitignore'))

      expect(
        mockShowInformationMessage,
        'should not ask the user if they want to associate .dvc and dvc.lock files with yaml on a normal editor change'
      ).not.to.be.called

      const getDvcLock = () => window.showTextDocument(getUri('dvc.lock'))

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

  describe('recommendAddDvcYamlSchemaOnce', () => {
    it('should only try to add dvc.yaml schema validation once per session', async () => {
      stub(Extensions, 'isAvailable').resolves(true)
      const mockShowInformationMessage = stub(
        window,
        'showInformationMessage'
      ).resolves('No' as unknown as MessageItem)

      await window.showTextDocument(getUri('.gitignore'))

      expect(
        mockShowInformationMessage,
        'should not ask the user if they want to add the dvc.yaml schema validation on a normal editor change'
      ).not.to.be.called

      const getDvcYaml = () => window.showTextDocument(getUri('dvc.yaml'))

      await getDvcYaml()

      expect(
        mockShowInformationMessage,
        'should ask the user if they want to add the dvc.yaml schema validation on the first call'
      ).to.be.calledOnce

      await commands.executeCommand('workbench.action.closeAllEditors')

      mockShowInformationMessage.resetHistory()

      await getDvcYaml()

      expect(
        mockShowInformationMessage,
        'should not ask the user if they want to add the dvc.yaml schema validation on subsequent calls'
      ).not.to.be.called
    })
  })
})
