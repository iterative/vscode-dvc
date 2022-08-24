import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import { window, commands, Uri, MessageItem } from 'vscode'
import { Disposable } from '../../../extension'
import { DvcExecutor } from '../../../cli/dvc/executor'
import { closeAllEditors, stubPrivatePrototypeMethod } from '../util'
import { dvcDemoPath } from '../../util'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../commands/external'
import { WorkspaceRepositories } from '../../../repository/workspace'
import { Cli } from '../../../cli'
import { GitCli } from '../../../cli/git'

suite('Source Control Management Test Suite', () => {
  const disposable = Disposable.fn()
  const rootUri = Uri.file(dvcDemoPath)
  const relPath = join('data', 'MNIST')
  const resourceUri = Uri.file(join(dvcDemoPath, relPath))

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return closeAllEditors()
  })

  describe('SourceControlManagement', () => {
    it('should be able to run dvc.addTarget without error', async () => {
      const mockAdd = stub(DvcExecutor.prototype, 'add').resolves('')

      await commands.executeCommand(RegisteredCliCommands.ADD_TARGET, {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockAdd).to.be.calledOnce
    })

    it('should not prompt to force if dvc.checkout fails without a prompt error', async () => {
      const mockCheckout = stub(DvcExecutor.prototype, 'checkout').rejects(
        'This is not a error that we would ask the user if they want to try and force'
      )
      const mockShowErrorMessage = stub(window, 'showErrorMessage').resolves(
        '' as unknown as MessageItem
      )

      await commands.executeCommand(RegisteredCliCommands.CHECKOUT, { rootUri })

      expect(mockCheckout).to.be.calledOnce
      expect(mockShowErrorMessage).to.be.calledOnce
      expect(mockCheckout).to.be.calledWith(rootUri.fsPath)
    })

    it('should be able to run dvc.checkoutTarget without error', async () => {
      const mockCheckout = stub(DvcExecutor.prototype, 'checkout').resolves('')

      await commands.executeCommand(RegisteredCliCommands.CHECKOUT_TARGET, {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockCheckout).to.be.calledOnce
    })

    it('should prompt to force if dvc.checkoutTarget fails', async () => {
      const mockCheckout = stub(DvcExecutor.prototype, 'checkout')
        .onFirstCall()
        .rejects({
          stderr: 'Use `-f` to force.'
        })
        .onSecondCall()
        .resolves('')
      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('Force' as unknown as MessageItem)

      await commands.executeCommand(RegisteredCliCommands.CHECKOUT_TARGET, {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockCheckout).to.be.calledTwice
      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockCheckout).to.be.calledWith(dvcDemoPath, relPath)
      expect(mockCheckout).to.be.calledWith(dvcDemoPath, relPath, '-f')
    })

    it('should not run dvc commit if there are no changes in the repository', async () => {
      const mockCommit = stub(DvcExecutor.prototype, 'commit').resolves('')
      const executeCommandSpy = spy(commands, 'executeCommand')
      stubPrivatePrototypeMethod(WorkspaceRepositories, 'hasChanges').returns(
        false
      )

      await commands.executeCommand(RegisteredCliCommands.COMMIT, { rootUri })

      expect(mockCommit).not.to.be.called
      expect(executeCommandSpy).to.be.calledOnce
    })

    it('should focus the git commit text input box after running dvc commit', async () => {
      const mockCommit = stub(DvcExecutor.prototype, 'commit').resolves('')
      const executeCommandSpy = spy(commands, 'executeCommand')
      stubPrivatePrototypeMethod(WorkspaceRepositories, 'hasChanges').returns(
        true
      )

      await commands.executeCommand(RegisteredCliCommands.COMMIT, { rootUri })

      expect(mockCommit).to.be.calledOnce
      expect(executeCommandSpy).to.be.calledTwice
      expect(executeCommandSpy).to.be.calledWith('workbench.scm.focus')
    })

    it('should prompt to force if dvc.commit fails', async () => {
      const mockCommit = stub(DvcExecutor.prototype, 'commit')
        .onFirstCall()
        .rejects({
          stderr: 'Use `-f` to force.'
        })
        .onSecondCall()
        .resolves('')
      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('Force' as unknown as MessageItem)

      stubPrivatePrototypeMethod(WorkspaceRepositories, 'hasChanges').returns(
        true
      )

      await commands.executeCommand(RegisteredCliCommands.COMMIT, { rootUri })

      expect(mockCommit).to.be.calledTwice
      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockCommit).to.be.calledWith(dvcDemoPath)
      expect(mockCommit).to.be.calledWith(dvcDemoPath, '-f')
    })

    it('should be able to run dvc.commitTarget without error', async () => {
      const mockCommit = stub(DvcExecutor.prototype, 'commit').resolves('')

      await commands.executeCommand(RegisteredCliCommands.COMMIT_TARGET, {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockCommit).to.be.calledOnce
    })

    it('should prompt to force if dvc.commitTarget fails', async () => {
      const mockCommit = stub(DvcExecutor.prototype, 'commit')
        .onFirstCall()
        .rejects({
          stderr: 'Use `-f` to force.'
        })
        .onSecondCall()
        .resolves('')
      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('Force' as unknown as MessageItem)

      await commands.executeCommand(RegisteredCliCommands.COMMIT_TARGET, {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockCommit).to.be.calledTwice
      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockCommit).to.be.calledWith(dvcDemoPath, relPath)
      expect(mockCommit).to.be.calledWith(dvcDemoPath, relPath, '-f')
    })

    it('should not prompt to force if dvc.pull fails without a prompt error', async () => {
      const mockPull = stub(DvcExecutor.prototype, 'pull')
        .onFirstCall()
        .rejects('The remote has gone away')
      const mockShowErrorMessage = stub(window, 'showErrorMessage').resolves(
        '' as unknown as MessageItem
      )

      await commands.executeCommand(RegisteredCliCommands.PULL, { rootUri })

      expect(mockPull).to.be.calledOnce
      expect(mockShowErrorMessage).to.be.calledOnce
    })

    it('should not prompt to force if dvc.push fails without a prompt error', async () => {
      const mockPush = stub(DvcExecutor.prototype, 'push').rejects(
        'The remote has gone away'
      )
      const mockShowErrorMessage = stub(window, 'showErrorMessage').resolves(
        '' as unknown as MessageItem
      )

      await commands.executeCommand(RegisteredCliCommands.PUSH, { rootUri })

      expect(mockPush).to.be.calledOnce
      expect(mockShowErrorMessage).to.be.calledOnce
    })

    it('should stage all git tracked files', async () => {
      const gitRoot = resolve(dvcDemoPath, '..')
      const mockGetGitRepositoryRoot = stub(
        GitCli.prototype,
        'getGitRepositoryRoot'
      ).resolves(gitRoot)
      const mockExecuteProcess = stubPrivatePrototypeMethod(
        Cli,
        'executeProcess'
      ).resolves('')

      await commands.executeCommand(RegisteredCliCommands.GIT_STAGE_ALL, {
        rootUri
      })

      expect(mockGetGitRepositoryRoot).to.be.calledOnce
      expect(mockExecuteProcess).to.be.calledOnce
      expect(mockExecuteProcess).to.be.calledWith({
        args: ['add', '.'],
        cwd: gitRoot,
        executable: 'git'
      })
    })

    it('should unstage all git tracked files', async () => {
      const mockExecuteProcess = stubPrivatePrototypeMethod(
        Cli,
        'executeProcess'
      )

      await commands.executeCommand(RegisteredCliCommands.GIT_UNSTAGE_ALL, {
        rootUri
      })

      expect(mockExecuteProcess).to.be.calledOnce
      expect(mockExecuteProcess).to.be.calledWith({
        args: ['reset'],
        cwd: dvcDemoPath,
        executable: 'git'
      })
    })

    it('should not reset the workspace if the user does not confirm', async () => {
      const mockCheckout = stub(DvcExecutor.prototype, 'checkout').resolves('')
      const mockExecuteProcess = stubPrivatePrototypeMethod(
        Cli,
        'executeProcess'
      )

      stubPrivatePrototypeMethod(WorkspaceRepositories, 'hasChanges').returns(
        true
      )

      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('' as unknown as MessageItem)

      await commands.executeCommand(
        RegisteredCommands.DISCARD_WORKSPACE_CHANGES,
        {
          rootUri
        }
      )

      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockCheckout).not.to.be.called
      expect(mockExecuteProcess).not.to.be.called
    })

    it('should reset the workspace if the user confirms they want to', async () => {
      const mockCheckout = stub(DvcExecutor.prototype, 'checkout').resolves('')
      const mockExecuteProcess = stubPrivatePrototypeMethod(
        Cli,
        'executeProcess'
      )

      stubPrivatePrototypeMethod(WorkspaceRepositories, 'hasChanges').returns(
        true
      )

      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('Discard Changes' as unknown as MessageItem)

      await commands.executeCommand(
        RegisteredCommands.DISCARD_WORKSPACE_CHANGES,
        {
          rootUri
        }
      )

      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockCheckout).to.be.calledOnce
      expect(mockExecuteProcess).to.be.calledTwice
      expect(mockExecuteProcess).to.be.calledWith({
        args: ['reset', '--hard', 'HEAD'],
        cwd: dvcDemoPath,
        executable: 'git'
      })
      expect(mockExecuteProcess).to.be.calledWith({
        args: ['clean', '-f', '-d', '-q'],
        cwd: dvcDemoPath,
        executable: 'git'
      })
    })

    it('should not reset the workspace if there is another user initiated command running', async () => {
      const mockCheckout = stub(DvcExecutor.prototype, 'checkout').resolves('')
      const mockExecuteProcess = stubPrivatePrototypeMethod(
        Cli,
        'executeProcess'
      )

      stubPrivatePrototypeMethod(WorkspaceRepositories, 'hasChanges').returns(
        true
      )

      stub(DvcExecutor.prototype, 'isScmCommandRunning').returns(true)

      await commands.executeCommand(
        RegisteredCommands.DISCARD_WORKSPACE_CHANGES,
        {
          rootUri
        }
      )

      expect(mockCheckout).not.to.be.called
      expect(mockExecuteProcess).not.to.be.called
    })
  })
})
