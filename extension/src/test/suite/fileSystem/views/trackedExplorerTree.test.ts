import path from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { ensureFileSync } from 'fs-extra'
import { window, commands, Uri, TextEditor, MessageItem } from 'vscode'
import { Disposable } from '../../../../extension'
import { exists } from '../../../../fileSystem'
import * as Workspace from '../../../../fileSystem/workspace'
import * as FileSystem from '../../../../fileSystem'
import { getConfigValue, setConfigValue } from '../../../../vscode/config'
import { CliExecutor } from '../../../../cli/executor'
import { Prompt } from '../../../../cli/output'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all tracked explorer tree tests.')

  const { join, resolve } = path

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
  const openFileCommand = 'dvc.views.trackedExplorerTree.openFile'
  const noOpenUnsupportedOption =
    'dvc.views.trackedExplorerTree.noOpenUnsupported'
  const noPromptPullMissingOption =
    'dvc.views.trackedExplorerTree.noPromptPullMissing'

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    setConfigValue(noOpenUnsupportedOption, undefined)
    setConfigValue(noPromptPullMissingOption, undefined)
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('TrackedExplorerTree', () => {
    it('should be able to run dvc.deleteTarget without error', async () => {
      const path = join(dvcDemoPath, 'deletable.txt')
      ensureFileSync(path)
      expect(exists(path)).to.be.true

      await commands.executeCommand('dvc.deleteTarget', path)
      expect(exists(path)).to.be.false
    })

    it('should be able to open a non-binary file', async () => {
      const relPath = join('logs', 'acc.tsv')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      stub(FileSystem, 'exists').returns(true)

      const uri = Uri.file(absPath)

      const mockShowTextDocument = stub(window, 'showTextDocument').resolves(({
        document: { fileName: absPath }
      } as unknown) as TextEditor)

      const textEditor = (await commands.executeCommand(
        openFileCommand,
        uri
      )) as TextEditor

      expect(textEditor.document.fileName).to.equal(absPath)
      expect(mockShowTextDocument).to.be.calledWith(uri)
    })

    it('should only call showInformationMessage when trying to open a binary file without the no binary errors option set', async () => {
      const relPath = 'model.pt'
      const absPath = join(dvcDemoPath, relPath)
      const uri = Uri.file(absPath)
      stub(path, 'relative').returns(relPath)
      stub(FileSystem, 'exists').returns(true)
      stub(window, 'showTextDocument').rejects(
        new Error('File seems to be binary and cannot be opened as text')
      )

      const mockShowInformationMessage = stub(window, 'showInformationMessage')

      expect(!!getConfigValue(noOpenUnsupportedOption)).to.be.false
      mockShowInformationMessage.resolves(undefined)

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(!!getConfigValue(noOpenUnsupportedOption)).to.be.false
      mockShowInformationMessage.resetHistory()
      mockShowInformationMessage.resolves(
        ("Don't Show Again" as unknown) as MessageItem
      )

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(getConfigValue(noOpenUnsupportedOption)).to.be.true
      mockShowInformationMessage.resetHistory()

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).not.to.be.called
      expect(getConfigValue(noOpenUnsupportedOption)).to.be.true
    })

    it('should be able to pull a file after trying to open it and it does not exist on disk and the no missing errors option is unset', async () => {
      const missingFile = 'non-existent.txt'
      const absPath = join(dvcDemoPath, missingFile)
      const uri = Uri.file(absPath)
      stub(path, 'relative').returns(missingFile)

      const mockShowInformationMessage = stub(window, 'showInformationMessage')

      mockShowInformationMessage.resolves(undefined)
      const mockPull = stub(CliExecutor.prototype, 'pull').resolves(
        'M       non-existent.txt\n1 file modified'
      )

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockPull).not.to.be.called

      mockShowInformationMessage.resetHistory()
      mockShowInformationMessage.resolves(
        ('Pull File' as unknown) as MessageItem
      )

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockPull).to.be.calledOnce

      mockPull.resetHistory()
      mockShowInformationMessage.resetHistory()
      mockShowInformationMessage.resolves(
        ("Don't Show Again" as unknown) as MessageItem
      )

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockPull).not.to.be.called

      mockShowInformationMessage.resetHistory()

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).not.to.be.called
      expect(mockPull).not.to.be.called
    })

    it('should be able to run dvc.removeTarget without error', async () => {
      const relPath = join('mock', 'data', 'MNIST', 'raw')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockDeleteTarget = stub(Workspace, 'deleteTarget').resolves(true)
      const mockRemoveTarget = stub(
        CliExecutor.prototype,
        'removeTarget'
      ).resolves('target destroyed!')

      await commands.executeCommand('dvc.removeTarget', absPath)
      expect(mockDeleteTarget).to.be.calledOnce
      expect(mockRemoveTarget).to.be.calledOnce
    })

    it('should be able to run dvc.pullTarget without error', async () => {
      const relPath = 'data'
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockPull = stub(CliExecutor.prototype, 'pull').resolves(
        'target pulled'
      )

      await commands.executeCommand('dvc.pullTarget', absPath)

      expect(mockPull).to.be.calledOnce
    })

    it('should prompt to force if dvc.pullTarget fails', async () => {
      const relPath = join('data', 'MNIST')
      const absPath = join(dvcDemoPath, relPath)

      stub(path, 'relative').returns(relPath)
      const mockPull = stub(CliExecutor.prototype, 'pull')
        .onFirstCall()
        .rejects({
          stderr: Prompt.TRY_FORCE
        })
        .onSecondCall()
        .resolves('')
      const mockShowInformationMessage = stub(
        window,
        'showWarningMessage'
      ).resolves(('Force' as unknown) as MessageItem)

      await commands.executeCommand('dvc.pullTarget', absPath)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockPull).to.be.calledTwice
      expect(mockPull).to.be.calledWith(undefined, relPath)
      expect(mockPull).to.be.calledWith(undefined, relPath, '-f')
    })

    it('should be able to run dvc.pushTarget without error', async () => {
      const relPath = join('data', 'MNIST')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockPush = stub(CliExecutor.prototype, 'pushTarget').resolves(
        'target pushed'
      )

      await commands.executeCommand('dvc.pushTarget', absPath)

      expect(mockPush).to.be.calledOnce
    })

    it('should prompt to force if dvc.pushTarget fails', async () => {
      const relPath = join('data', 'MNIST')
      const absPath = join(dvcDemoPath, relPath)

      stub(path, 'relative').returns(relPath)
      const mockPushTarget = stub(CliExecutor.prototype, 'pushTarget')
        .onFirstCall()
        .rejects({
          stderr: Prompt.TRY_FORCE
        })
        .onSecondCall()
        .resolves('')
      const mockShowInformationMessage = stub(
        window,
        'showWarningMessage'
      ).resolves(('Force' as unknown) as MessageItem)

      await commands.executeCommand('dvc.pushTarget', absPath)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockPushTarget).to.be.calledTwice
      expect(mockPushTarget).to.be.calledWith(undefined, relPath)
      expect(mockPushTarget).to.be.calledWith(undefined, relPath, '-f')
    })
  })
})
