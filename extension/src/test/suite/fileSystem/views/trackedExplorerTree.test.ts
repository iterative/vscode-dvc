import path from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { ensureFileSync } from 'fs-extra'
import { window, commands, Uri, TextEditor, MessageItem } from 'vscode'
import { Disposable } from '../../../../extension'
import { exists } from '../../../../fileSystem'
import * as Process from '../../../../processExecution'
import * as Workspace from '../../../../fileSystem/workspace'
import { getConfigValue, setConfigValue } from '../../../../vscode/config'

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
  const noOpenFileErrorsOption =
    'dvc.views.trackedExplorerTree.noOpenFileErrors'

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    setConfigValue(noOpenFileErrorsOption, undefined)
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
      const path = join(dvcDemoPath, 'logs', 'acc.tsv')
      const uri = Uri.file(path)

      const mockShowTextDocument = stub(window, 'showTextDocument').resolves(({
        document: { fileName: path }
      } as unknown) as TextEditor)

      const textEditor = (await commands.executeCommand(
        openFileCommand,
        uri
      )) as TextEditor

      expect(textEditor.document.fileName).to.equal(path)
      expect(mockShowTextDocument).to.be.calledWith(uri)
    })

    it('should only call showInformationMessage when trying to open a binary file without the no errors option set', async () => {
      const path = join(dvcDemoPath, 'model.pt')
      const uri = Uri.file(path)

      const mockShowInformationMessage = stub(window, 'showInformationMessage')

      expect(!!getConfigValue(noOpenFileErrorsOption)).to.be.false
      mockShowInformationMessage.resolves(undefined)

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(!!getConfigValue(noOpenFileErrorsOption)).to.be.false
      mockShowInformationMessage.resetHistory()
      mockShowInformationMessage.resolves(
        ('Do not show this message again.' as unknown) as MessageItem
      )

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(getConfigValue(noOpenFileErrorsOption)).to.be.true
      mockShowInformationMessage.resetHistory()

      await commands.executeCommand(openFileCommand, uri)

      expect(mockShowInformationMessage).not.to.be.called
      expect(getConfigValue(noOpenFileErrorsOption)).to.be.true
    })

    it('should be able to run dvc.removeTarget without error', async () => {
      const relPath = join('mock', 'data', 'MNIST', 'raw')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockDeleteTarget = stub(Workspace, 'deleteTarget').resolves(true)
      const mockProcess = stub(Process, 'executeProcess').resolves('fun')

      await commands.executeCommand('dvc.removeTarget', absPath)
      expect(mockDeleteTarget).to.be.calledOnce
      expect(mockProcess).to.be.calledOnce
      expect(mockProcess).to.be.calledWith({
        args: ['remove', join('mock', 'data', 'MNIST', 'raw.dvc')],
        cwd: undefined,
        env: process.env,
        executable: 'dvc'
      })
    })

    it('should be able to run dvc.pullTarget without error', async () => {
      const relPath = 'data'
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockProcess = stub(Process, 'executeProcess').resolves('fun')

      await commands.executeCommand('dvc.pullTarget', absPath)

      expect(mockProcess).to.be.calledOnce
      expect(mockProcess).to.be.calledWith({
        args: ['pull', relPath],
        cwd: undefined,
        env: process.env,
        executable: 'dvc'
      })
    })
  })

  it('should be able to run dvc.pushTarget without error', async () => {
    const relPath = join('data', 'MNIST')
    const absPath = join(dvcDemoPath, relPath)
    stub(path, 'relative').returns(relPath)
    const mockProcess = stub(Process, 'executeProcess').resolves('fun')

    await commands.executeCommand('dvc.pushTarget', absPath)

    expect(mockProcess).to.be.calledOnce
    expect(mockProcess).to.be.calledWith({
      args: ['push', relPath],
      cwd: undefined,
      env: process.env,
      executable: 'dvc'
    })
  })
})
