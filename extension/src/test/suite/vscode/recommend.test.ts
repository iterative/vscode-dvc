import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { MessageItem, Uri, window } from 'vscode'
import { restore, stub } from 'sinon'
import { closeAllEditors } from '../util'
import { dvcDemoPath } from '../../util'
import * as Extensions from '../../../vscode/extensions'

suite('Recommend Test Suite', () => {
  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    return closeAllEditors()
  })

  const openFileInEditor = (fileName: string) =>
    window.showTextDocument(Uri.file(join(dvcDemoPath, fileName)))

  describe('recommendRedHatExtensionOnce', () => {
    it('should only recommend the red hat yaml extension once per session', async () => {
      stub(Extensions, 'isInstalled').returns(false)
      const mockShowInformationMessage = stub(
        window,
        'showInformationMessage'
      ).resolves('Show' as unknown as MessageItem)

      await openFileInEditor('.gitignore')

      expect(
        mockShowInformationMessage,
        'should not recommend to install the red hat yaml extension on a normal editor change'
      ).not.to.be.called

      await openFileInEditor('dvc.lock')

      expect(
        mockShowInformationMessage,
        'should recommend to install the red hat yaml extension on the first call'
      ).to.be.calledOnce

      await closeAllEditors()

      mockShowInformationMessage.resetHistory()

      await openFileInEditor('dvc.lock')

      expect(
        mockShowInformationMessage,
        'should not recommend to install the red hat yaml extension on subsequent calls'
      ).not.to.be.called
    }).timeout(6000)
  })
})
