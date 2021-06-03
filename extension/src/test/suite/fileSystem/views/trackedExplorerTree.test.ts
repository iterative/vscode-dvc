import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { ensureFileSync } from 'fs-extra'
import { window, commands, Uri } from 'vscode'
import { Disposable } from '../../../../extension'
import { exists } from '../../../../fileSystem'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all tracked explorer tree tests.')

  const dvcDemoPath = resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    '..',
    'demo'
  )
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('TrackedExplorerTree', () => {
    it('should be able to run deleteTarget without error', async () => {
      const path = join(dvcDemoPath, 'deletable.txt')
      ensureFileSync(path)
      expect(exists(path)).to.be.true

      await commands.executeCommand('dvc.deleteTarget', path)
      expect(exists(path)).to.be.false
    })

    it('should be able to run dvc.views.trackedExplorerTree.openFile when opening a non-binary file', async () => {
      const path = join(dvcDemoPath, 'logs', 'acc.tsv')
      const uri = Uri.file(path)

      await commands.executeCommand(
        'dvc.views.trackedExplorerTree.openFile',
        uri
      )

      expect(window.activeTextEditor?.document.fileName).to.equal(path)
    })

    it('should call the showErrorMessage when dvc.views.trackedExplorerTree.openFile tries to open a binary file', async () => {
      const path = join(dvcDemoPath, 'model.pt')
      const uri = Uri.file(path)

      const mockShowErrorMessage = stub(window, 'showErrorMessage').resolves()

      await commands.executeCommand(
        'dvc.views.trackedExplorerTree.openFile',
        uri
      )

      expect(mockShowErrorMessage).to.be.calledOnce
    })
  })
})
