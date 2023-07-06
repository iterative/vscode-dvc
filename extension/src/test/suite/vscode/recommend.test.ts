import { join } from 'path'
import { afterEach, before, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { MessageItem, Uri, window } from 'vscode'
import { restore, stub } from 'sinon'
import { closeAllEditors } from '../util'
import { dvcDemoPath } from '../../util'
import * as Extensions from '../../../vscode/extensions'
import { recommendRedHatExtensionOnce } from '../../../vscode/recommend'

suite('Recommend Test Suite', () => {
  const openFileInEditor = (fileName: string) =>
    window.showTextDocument(Uri.file(join(dvcDemoPath, fileName)))

  before(async () => {
    await openFileInEditor('dvc.lock') // clear any existing recommendation
    return closeAllEditors()
  })

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    return closeAllEditors()
  })

  describe('recommendRedHatExtensionOnce', () => {
    it('should only recommend the red hat yaml extension once per session', async () => {
      recommendRedHatExtensionOnce()
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
    }).timeout(10000)
  })
})
