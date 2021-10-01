import path, { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import { ensureFileSync } from 'fs-extra'
import {
  window,
  commands,
  Uri,
  MessageItem,
  ViewColumn,
  WorkspaceEdit,
  workspace
} from 'vscode'
import { Disposable } from '../../../extension'
import * as Workspace from '../../../fileSystem/workspace'
import { CliExecutor } from '../../../cli/executor'
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
import { TrackedExplorerTree } from '../../../fileSystem/tree'

suite('Tracked Explorer Tree Test Suite', () => {
  const { join } = path

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('TrackedExplorerTree', () => {
    it('should appear in the UI', async () => {
      await expect(
        commands.executeCommand('dvc.views.trackedExplorerTree.focus')
      ).to.be.eventually.equal(undefined)
    })

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

      const mockApplyEdit = stub(workspace, 'applyEdit').resolves(undefined)

      await commands.executeCommand(RegisteredCommands.DELETE_TARGET, path)

      expect(mockApplyEdit).to.be.calledOnce
    })

    it('should be able to add data to a tracked data directory (.dvc)', async () => {
      const mockData = [
        'extra-data.txt',
        'more-extra-data.txt',
        'even-more-extra-data.txt'
      ]
      const mockDestination = join(dvcDemoPath, 'data', 'MNIST', 'raw')
      ensureFileSync(mockDestination + '.dvc')

      const expectedTargets = mockData.map(file => join(dvcDemoPath, file))
      const expectedDestinations = mockData.map(file =>
        join(mockDestination, file)
      )

      const mockUris = expectedTargets.map(file => Uri.file(file))

      const mockResourcePicker = stub(window, 'showOpenDialog').resolves(
        mockUris
      )

      const mockRename = stub(WorkspaceEdit.prototype, 'renameFile').resolves(
        undefined
      )

      stub(window, 'showWarningMessage').resolves(
        'Move' as unknown as MessageItem
      )

      await commands.executeCommand('dvc.moveTargets', mockDestination)

      expect(mockResourcePicker).to.be.calledOnce
      expect(mockRename).to.be.calledThrice

      for (let i = 0; i <= 2; i++) {
        const [target, dest] = mockRename.getCall(i).args
        expect(target.fsPath).to.equal(expectedTargets[i])
        expect(dest.fsPath).to.equal(expectedDestinations[i])
      }
    })

    it('should not add data to a tracked data directory if the user changes their mind', async () => {
      const mockData = ['data-i-will-not-move.txt']
      const mockDestination = join(dvcDemoPath, 'data', 'MNIST', 'raw')

      const mockUris = mockData.map(file => Uri.file(join(dvcDemoPath, file)))

      const mockResourcePicker = stub(window, 'showOpenDialog').resolves(
        mockUris
      )

      const mockRename = stub(WorkspaceEdit.prototype, 'renameFile').resolves(
        undefined
      )

      stub(window, 'showWarningMessage').resolves(
        'Cancel' as unknown as MessageItem
      )

      await commands.executeCommand('dvc.moveTargets', mockDestination)

      expect(mockResourcePicker).to.be.calledOnce
      expect(mockRename).not.to.be.called
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

    it('should be able to search in a folder', async () => {
      const searchDir = __dirname
      const executeCommandSpy = spy(commands, 'executeCommand')

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_FIND_IN_FOLDER,
        searchDir
      )

      expect(executeCommandSpy).to.be.calledWith(
        'filesExplorer.findInFolder',
        Uri.file(searchDir)
      )
    })

    it('should be able to compare two files', async () => {
      const baseline = __filename
      const comparison = resolve(__dirname, '..', '..', '..', 'extension.js')
      const executeCommandSpy = spy(commands, 'executeCommand')

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_SELECT_FOR_COMPARE,
        baseline
      )

      expect(
        executeCommandSpy,
        'should call executeCommand with the args required to select a file to compare against'
      ).to.be.calledWith('selectForCompare', Uri.file(baseline))
      executeCommandSpy.resetHistory()

      await commands.executeCommand(
        RegisteredCommands.TRACKED_EXPLORER_COMPARE_SELECTED,
        comparison
      )

      expect(
        executeCommandSpy,
        'should call executeCommand with the args required to compare the files'
      ).to.be.calledWith('compareFiles', Uri.file(comparison))
    })

    it('should be able to run dvc.removeTarget without error', async () => {
      const relPath = join('mock', 'data', 'MNIST', 'raw')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((TrackedExplorerTree as any).prototype, 'getPathItem').returns({
        dvcRoot: dvcDemoPath
      })

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((TrackedExplorerTree as any).prototype, 'getPathItem').returns({
        dvcRoot: dvcDemoPath
      })

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((TrackedExplorerTree as any).prototype, 'getPathItem').returns({
        dvcRoot: dvcDemoPath
      })

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((TrackedExplorerTree as any).prototype, 'getPathItem').returns({
        dvcRoot: dvcDemoPath
      })

      const mockPull = stub(CliExecutor.prototype, 'pull')
        .onFirstCall()
        .rejects({
          stderr: "Use '-f' to force."
        })
        .onSecondCall()
        .resolves('')
      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('Force' as unknown as MessageItem)

      await commands.executeCommand(RegisteredCliCommands.PULL_TARGET, absPath)

      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockPull).to.be.calledTwice
      expect(mockPull).to.be.calledWith(dvcDemoPath, relPath)
      expect(mockPull).to.be.calledWith(dvcDemoPath, relPath, '-f')
    })

    it('should be able to run dvc.pushTarget without error', async () => {
      const relPath = join('data', 'MNIST')
      const absPath = join(dvcDemoPath, relPath)
      stub(path, 'relative').returns(relPath)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((TrackedExplorerTree as any).prototype, 'getPathItem').returns({
        dvcRoot: dvcDemoPath
      })

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub((TrackedExplorerTree as any).prototype, 'getPathItem').returns({
        dvcRoot: dvcDemoPath
      })

      const mockPush = stub(CliExecutor.prototype, 'push')
        .onFirstCall()
        .rejects({
          stderr: "I AM AN ERROR. Use '-f' to force."
        })
        .onSecondCall()
        .resolves('')
      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('Force' as unknown as MessageItem)

      await commands.executeCommand(RegisteredCliCommands.PUSH_TARGET, absPath)

      expect(mockShowWarningMessage).to.be.calledWith(
        'I AM AN ERROR. \n\nWould you like to force this action?',
        { modal: true },
        'Force'
      )
      expect(mockPush).to.be.calledTwice
      expect(mockPush).to.be.calledWith(dvcDemoPath, relPath)
      expect(mockPush).to.be.calledWith(dvcDemoPath, relPath, '-f')
    })
  })
})
