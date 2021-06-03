import path from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { ensureFileSync } from 'fs-extra'
import { window, commands, Uri } from 'vscode'
import { Disposable } from '../../../../extension'
import { exists } from '../../../../fileSystem'
import * as Process from '../../../../processExecution'
import * as Workspace from '../../../../fileSystem/workspace'

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

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
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
