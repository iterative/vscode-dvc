import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import { window, commands, Uri, MessageItem } from 'vscode'
import { Disposable } from '../../../extension'
import { CliExecutor } from '../../../cli/executor'
import { closeAllEditors } from '../util'
import { dvcDemoPath } from '../../util'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../commands/external'
import * as ProcessExecution from '../../../processExecution'
import { WorkspaceRepositories } from '../../../repository/workspace'

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
      const mockAdd = stub(CliExecutor.prototype, 'add').resolves('')

      await commands.executeCommand(RegisteredCliCommands.ADD_TARGET, {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockAdd).to.be.calledOnce
    })

    it('should not prompt to force if dvc.checkout fails without a prompt error', async () => {
      const mockCheckout = stub(CliExecutor.prototype, 'checkout').rejects(
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
      const mockCheckout = stub(CliExecutor.prototype, 'checkout').resolves('')

      await commands.executeCommand(RegisteredCliCommands.CHECKOUT_TARGET, {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockCheckout).to.be.calledOnce
    })

    it('should prompt to force if dvc.checkoutTarget fails', async () => {
      const mockCheckout = stub(CliExecutor.prototype, 'checkout')
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
      const mockCommit = stub(CliExecutor.prototype, 'commit').resolves('')
      const executeCommandSpy = spy(commands, 'executeCommand')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(WorkspaceRepositories.prototype as any, 'hasChanges').returns(false)

      await commands.executeCommand(RegisteredCliCommands.COMMIT, { rootUri })

      expect(mockCommit).not.to.be.called
      expect(executeCommandSpy).to.be.calledOnce
    })

    it('should focus the git commit text input box after running dvc commit', async () => {
      const mockCommit = stub(CliExecutor.prototype, 'commit').resolves('')
      const executeCommandSpy = spy(commands, 'executeCommand')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(WorkspaceRepositories.prototype as any, 'hasChanges').returns(true)

      await commands.executeCommand(RegisteredCliCommands.COMMIT, { rootUri })

      expect(mockCommit).to.be.calledOnce
      expect(executeCommandSpy).to.be.calledTwice
      expect(executeCommandSpy).to.be.calledWith('workbench.scm.focus')
    })

    it('should prompt to force if dvc.commit fails', async () => {
      const mockCommit = stub(CliExecutor.prototype, 'commit')
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(WorkspaceRepositories.prototype as any, 'hasChanges').returns(true)

      await commands.executeCommand(RegisteredCliCommands.COMMIT, { rootUri })

      expect(mockCommit).to.be.calledTwice
      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockCommit).to.be.calledWith(dvcDemoPath)
      expect(mockCommit).to.be.calledWith(dvcDemoPath, '-f')
    })

    it('should be able to run dvc.commitTarget without error', async () => {
      const mockCommit = stub(CliExecutor.prototype, 'commit').resolves('')

      await commands.executeCommand(RegisteredCliCommands.COMMIT_TARGET, {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockCommit).to.be.calledOnce
    })

    it('should prompt to force if dvc.commitTarget fails', async () => {
      const mockCommit = stub(CliExecutor.prototype, 'commit')
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
      const mockPull = stub(CliExecutor.prototype, 'pull')
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
      const mockPush = stub(CliExecutor.prototype, 'push').rejects(
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
      const mockGit = stub(ProcessExecution, 'executeProcess')
        .onFirstCall()
        .resolves(gitRoot)
        .onSecondCall()
        .resolves('')

      await commands.executeCommand(RegisteredCommands.GIT_STAGE_ALL, {
        rootUri
      })

      expect(mockGit).to.be.calledTwice
      expect(mockGit).to.be.calledWith({
        args: ['rev-parse', '--show-toplevel'],
        cwd: dvcDemoPath,
        executable: 'git'
      })
      expect(mockGit).to.be.calledWith({
        args: ['add', '.'],
        cwd: gitRoot,
        executable: 'git'
      })
    })

    it('should unstage all git tracked files', async () => {
      const mockGit = stub(ProcessExecution, 'executeProcess').resolves('')

      await commands.executeCommand(RegisteredCommands.GIT_UNSTAGE_ALL, {
        rootUri
      })

      expect(mockGit).to.be.calledOnce
      expect(mockGit).to.be.calledWith({
        args: ['reset'],
        cwd: dvcDemoPath,
        executable: 'git'
      })
    })

    it('should not reset the workspace if the user does not confirm', async () => {
      const mockCheckout = stub(CliExecutor.prototype, 'checkout').resolves('')
      const mockGitReset = stub(ProcessExecution, 'executeProcess').resolves('')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(WorkspaceRepositories.prototype as any, 'hasChanges').returns(true)

      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('' as unknown as MessageItem)

      await commands.executeCommand(RegisteredCommands.RESET_WORKSPACE, {
        rootUri
      })

      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockCheckout).not.to.be.called
      expect(mockGitReset).not.to.be.called
    })

    it('should reset the workspace if the user confirms they want to', async () => {
      const mockCheckout = stub(CliExecutor.prototype, 'checkout').resolves('')
      const mockGitReset = stub(ProcessExecution, 'executeProcess').resolves('')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(WorkspaceRepositories.prototype as any, 'hasChanges').returns(true)

      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves('Discard Changes' as unknown as MessageItem)

      await commands.executeCommand(RegisteredCommands.RESET_WORKSPACE, {
        rootUri
      })

      expect(mockShowWarningMessage).to.be.calledOnce
      expect(mockCheckout).to.be.calledOnce
      expect(mockGitReset).to.be.calledTwice
      expect(mockGitReset).to.be.calledWith({
        args: ['reset', '--hard', 'HEAD'],
        cwd: dvcDemoPath,
        executable: 'git'
      })
      expect(mockGitReset).to.be.calledWith({
        args: ['clean', '-f', '-d', '-q'],
        cwd: dvcDemoPath,
        executable: 'git'
      })
    })
  })
})
