import path from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore } from 'sinon'
import { ensureFileSync } from 'fs-extra'
import { window, commands, Uri, MessageItem, ViewColumn } from 'vscode'
import { Disposable } from '../../../extension'
import { exists } from '../../../fileSystem'
import * as Workspace from '../../../fileSystem/workspace'
import { CliExecutor } from '../../../cli/executor'
import { Prompt } from '../../../cli/output'
import * as WorkspaceFolders from '../../../vscode/workspaceFolders'
import * as Setup from '../../../setup'
import {
  activeTextEditorChangedEvent,
  dvcDemoPath,
  getActiveTextEditorFilename
} from '../util'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../commands/external'
import { setConfigValue } from '../../../vscode/config'

suite('Tracked Explorer Tree Test Suite', () => {
  window.showInformationMessage('Start all tracked explorer tree tests.')

  const { join } = path

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    setConfigValue(
      'dvc.views.trackedExplorerTree.noPromptPullMissing',
      undefined
    )
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('TrackedExplorerTree', () => {
    it('should be able to run dvc.copyFilePath and copy a path to the clipboard', async () => {
      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_COPY_FILE_PATH,
        dvcDemoPath
      )

      await commands.executeCommand('workbench.action.files.newUntitledFile')
      await commands.executeCommand('editor.action.clipboardPasteAction')

      expect(
        Uri.file(window.activeTextEditor?.document.getText() as string).fsPath
      ).to.equal(dvcDemoPath)
    })

    it('should be able to run dvc.copyRelativeFilePath and copy a path to the clipboard', async () => {
      const relPath = 'logs'
      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_COPY_REL_FILE_PATH,
        join(dvcDemoPath, relPath)
      )

      await commands.executeCommand('workbench.action.files.newUntitledFile')
      await commands.executeCommand('editor.action.clipboardPasteAction')

      expect(window.activeTextEditor?.document.getText()).to.equal(relPath)
    })

    it('should be able to run dvc.deleteTarget without error', async () => {
      const path = join(dvcDemoPath, 'deletable.txt')
      ensureFileSync(path)
      expect(exists(path)).to.be.true

      await commands.executeCommand(RegisteredCommands.DELETE_TARGET, path)
      expect(exists(path)).to.be.false
    })

    it('should be able to run dvc.init without error', async () => {
      const mockInit = stub(CliExecutor.prototype, 'init').resolves('')
      const mockSetup = stub(Setup, 'setup').resolves()

      await commands.executeCommand(RegisteredCliCommands.INIT)
      expect(mockInit).to.be.calledOnce
      expect(mockSetup).to.be.calledOnce

      mockInit.resetHistory()
      mockSetup.resetHistory()
      stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(undefined)

      await commands.executeCommand(RegisteredCliCommands.INIT)

      expect(mockInit).not.to.be.called
      expect(mockSetup).not.to.be.called
    })

    it('should be able to open a file', async () => {
      expect(getActiveTextEditorFilename()).not.to.equal(__filename)
      const uri = Uri.file(__filename)

      const activeEditorChanged = activeTextEditorChangedEvent()

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        uri
      )
      await activeEditorChanged

      expect(getActiveTextEditorFilename()).to.equal(__filename)
    })

    it('should be able to open a file to the side', async () => {
      expect(getActiveTextEditorFilename()).not.to.equal(__filename)

      const activeEditorChanged = activeTextEditorChangedEvent()

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_OPEN_TO_THE_SIDE,
        __filename
      )
      await activeEditorChanged

      expect(getActiveTextEditorFilename()).to.equal(__filename)
      expect(window.activeTextEditor?.viewColumn).not.to.equal(ViewColumn.One)
    })

    it('should not fail to open a file to the side if it is not on disk', async () => {
      const missingFile = 'missing.txt'
      const mockShowInformationMessage = stub(
        window,
        'showInformationMessage'
      ).resolves(undefined)

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_OPEN_TO_THE_SIDE,
        missingFile
      )

      expect(mockShowInformationMessage).to.be.calledOnce
    })

    it('should be able to pull a file after trying to open it when it does not exist on disk', async () => {
      const missingFile = 'non-existent.txt'
      const absPath = join(dvcDemoPath, missingFile)
      const uri = Uri.file(absPath)
      stub(path, 'relative').returns(missingFile)

      const mockShowInformationMessage = stub(window, 'showInformationMessage')

      mockShowInformationMessage.resolves(undefined)
      const mockPull = stub(CliExecutor.prototype, 'pull').resolves(
        'M       non-existent.txt\n1 file modified'
      )

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        uri
      )

      expect(
        mockShowInformationMessage,
        'should show the user an information prompt'
      ).to.be.calledOnce
      expect(mockPull, 'should not call pull if the prompt is dismissed').not.to
        .be.called

      mockShowInformationMessage.resetHistory()
      mockShowInformationMessage.resolves('Pull File' as unknown as MessageItem)

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        uri
      )

      expect(
        mockShowInformationMessage,
        'should show the user an information prompt'
      ).to.be.calledOnce
      expect(mockPull, 'should pull the file if prompted').to.be.calledOnce

      mockPull.resetHistory()
      mockShowInformationMessage.resetHistory()
      mockShowInformationMessage.resolves(
        "Don't Show Again" as unknown as MessageItem
      )

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        uri
      )

      expect(
        mockShowInformationMessage,
        'should show the user an information prompt'
      ).to.be.calledOnce
      expect(
        mockPull,
        'should not pull the file if the user chooses do not show again'
      ).not.to.be.called

      mockShowInformationMessage.resetHistory()

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_OPEN_FILE,
        uri
      )

      expect(
        mockShowInformationMessage,
        'should not show the information prompt if the appropriate config option is set'
      ).not.to.be.called
      expect(mockPull, 'should not pull the file').not.to.be.called
    })

    it('should be able to run dvc.removeTarget without error', async () => {
      const relPath = join('mock', 'data', 'MNIST', 'raw')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockDeleteTarget = stub(Workspace, 'deleteTarget').resolves(true)
      const mockRemove = stub(CliExecutor.prototype, 'remove').resolves(
        'target destroyed!'
      )

      await commands.executeCommand(
        RegisteredCliCommands.REMOVE_TARGET,
        absPath
      )
      expect(mockDeleteTarget).to.be.calledOnce
      expect(mockRemove).to.be.calledOnce
    })

    it('should be able to run dvc.renameTarget without error', async () => {
      const relPath = join('mock', 'data', 'MNIST', 'raw')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockMove = stub(CliExecutor.prototype, 'move').resolves(
        'target moved to new destination'
      )

      const mockInputBox = stub(window, 'showInputBox').resolves(
        relPath + 'est'
      )

      await commands.executeCommand(
        RegisteredCliCommands.RENAME_TARGET,
        absPath
      )
      expect(mockMove).to.be.calledOnce
      expect(mockInputBox).to.be.calledOnce
      expect(mockInputBox).to.be.calledWith({
        prompt: 'enter a destination relative to the root',
        value: relPath
      })
    })

    it('should be able to run dvc.pullTarget without error', async () => {
      const relPath = 'data'
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockPull = stub(CliExecutor.prototype, 'pull').resolves(
        'target pulled'
      )

      await commands.executeCommand(RegisteredCliCommands.PULL_TARGET, absPath)

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
      ).resolves('Force' as unknown as MessageItem)

      await commands.executeCommand(RegisteredCliCommands.PULL_TARGET, absPath)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockPull).to.be.calledTwice
      expect(mockPull).to.be.calledWith(undefined, relPath)
      expect(mockPull).to.be.calledWith(undefined, relPath, '-f')
    })

    it('should be able to run dvc.pushTarget without error', async () => {
      const relPath = join('data', 'MNIST')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)
      const mockPush = stub(CliExecutor.prototype, 'push').resolves(
        'target pushed'
      )

      await commands.executeCommand(RegisteredCliCommands.PUSH_TARGET, absPath)

      expect(mockPush).to.be.calledOnce
    })

    it('should prompt to force if dvc.pushTarget fails', async () => {
      const relPath = join('data', 'MNIST')
      const absPath = join(dvcDemoPath, relPath)

      stub(path, 'relative').returns(relPath)
      const mockPush = stub(CliExecutor.prototype, 'push')
        .onFirstCall()
        .rejects({
          stderr: Prompt.TRY_FORCE
        })
        .onSecondCall()
        .resolves('')
      const mockShowInformationMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('Force' as unknown as MessageItem)

      await commands.executeCommand(RegisteredCliCommands.PUSH_TARGET, absPath)

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockPush).to.be.calledTwice
      expect(mockPush).to.be.calledWith(undefined, relPath)
      expect(mockPush).to.be.calledWith(undefined, relPath, '-f')
    })
  })
})
