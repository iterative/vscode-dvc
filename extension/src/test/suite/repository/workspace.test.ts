import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import { commands } from 'vscode'
import { Disposable } from '../../../extension'
import { CliExecutor } from '../../../cli/executor'
import { RegisteredCliCommands } from '../../../commands/external'
import { WorkspaceRepositories } from '../../../repository/workspace'
import * as QuickPick from '../../../vscode/quickPick'
import { dvcDemoPath } from '../util'

suite('Workspace Repositories Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('dvc.commit', () => {
    it('should be able to run commit from the command palette with multiple roots in the workspace', async () => {
      const mockCommit = stub(CliExecutor.prototype, 'commit').resolves('')
      const executeCommandSpy = spy(commands, 'executeCommand')

      stub(WorkspaceRepositories.prototype, 'getDvcRoots').returns([
        dvcDemoPath,
        resolve(dvcDemoPath, '..', 'other', 'root')
      ])

      const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
        dvcDemoPath
      )

      await commands.executeCommand(RegisteredCliCommands.COMMIT)

      expect(mockCommit, 'should call commit').to.be.calledOnce
      expect(mockQuickPickOne, 'should ask the user to pick between the roots')
        .to.be.calledOnce
      expect(executeCommandSpy).to.be.calledTwice
      expect(
        executeCommandSpy,
        'should focus the git input box'
      ).to.be.calledWith('workbench.scm.focus')
    })
  })

  it('should be able to run checkout from the command palette with multiple roots in the workspace', async () => {
    const mockCheckout = stub(CliExecutor.prototype, 'checkout').resolves('')

    stub(WorkspaceRepositories.prototype, 'getDvcRoots').returns([
      dvcDemoPath,
      resolve(dvcDemoPath, '..', 'other', 'root')
    ])

    const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(
      dvcDemoPath
    )

    await commands.executeCommand(RegisteredCliCommands.CHECKOUT)

    expect(mockCheckout).to.be.calledOnce
    expect(mockQuickPickOne).to.be.calledOnce
  })

  it('should not run pull from the command palette if the user fails to select from multiple roots in the workspace', async () => {
    const mockPull = stub(CliExecutor.prototype, 'pull').resolves('')

    stub(WorkspaceRepositories.prototype, 'getDvcRoots').returns([
      dvcDemoPath,
      resolve(dvcDemoPath, '..', 'other', 'root')
    ])

    const mockQuickPickOne = stub(QuickPick, 'quickPickOne').resolves(undefined)

    await commands.executeCommand(RegisteredCliCommands.PULL)

    expect(mockPull).not.to.be.called
    expect(mockQuickPickOne).to.be.calledOnce
  })
})
