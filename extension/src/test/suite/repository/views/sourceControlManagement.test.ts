import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, Uri, MessageItem } from 'vscode'
import { Disposable } from '../../../../extension'
import { CliExecutor } from '../../../../cli/executor'
import { Prompt } from '../../../../cli/output'

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
  const rootUri = Uri.file(dvcDemoPath)
  const relPath = join('data', 'MNIST')
  const resourceUri = Uri.file(join(dvcDemoPath, relPath))

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('SourceControlManagement', () => {
    it('should be able to run dvc.addTarget without error', async () => {
      const mockAddTarget = stub(CliExecutor.prototype, 'addTarget').resolves(
        ''
      )

      await commands.executeCommand('dvc.addTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockAddTarget).to.be.calledOnce
    })

    it('should not prompt to force if dvc.checkout fails without a prompt error', async () => {
      const mockCheckout = stub(CliExecutor.prototype, 'checkout').rejects(
        'This is not a error that we would ask the user if they want to try and force'
      )
      const mockShowErrorMessage = stub(window, 'showErrorMessage').resolves(
        ('' as unknown) as MessageItem
      )
      const mockForceCheckout = stub(
        CliExecutor.prototype,
        'forceCheckout'
      ).resolves('')

      await commands.executeCommand('dvc.checkout', { rootUri })

      expect(mockCheckout).to.be.calledOnce
      expect(mockShowErrorMessage).to.be.calledOnce
      expect(mockForceCheckout).not.to.be.called
    })

    it('should be able to run dvc.checkoutTarget without error', async () => {
      const mockCheckout = stub(
        CliExecutor.prototype,
        'checkoutTarget'
      ).resolves('')

      await commands.executeCommand('dvc.checkoutTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockCheckout).to.be.calledOnce
    })

    it('should prompt to force if dvc.checkoutTarget fails', async () => {
      stub(CliExecutor.prototype, 'checkoutTarget').rejects({
        stderr: Prompt.TRY_FORCE
      })
      const mockShowInformationMessage = stub(
        window,
        'showWarningMessage'
      ).resolves(('Force' as unknown) as MessageItem)
      const mockForceCheckout = stub(
        CliExecutor.prototype,
        'forceCheckoutTarget'
      ).resolves('')

      await commands.executeCommand('dvc.checkoutTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockForceCheckout).to.be.calledOnce
    })

    it('should be able to run dvc.commit without error', async () => {
      const mockCommit = stub(CliExecutor.prototype, 'commit').resolves('')

      await commands.executeCommand('dvc.commit', { rootUri })

      expect(mockCommit).to.be.calledOnce
    })

    it('should prompt to force if dvc.commit fails', async () => {
      stub(CliExecutor.prototype, 'commit').rejects({
        stderr: Prompt.TRY_FORCE
      })
      const mockShowInformationMessage = stub(
        window,
        'showWarningMessage'
      ).resolves(('Force' as unknown) as MessageItem)
      const mockForceCommit = stub(
        CliExecutor.prototype,
        'forceCommit'
      ).resolves('')

      await commands.executeCommand('dvc.commit', { rootUri })

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockForceCommit).to.be.calledOnce
    })

    it('should be able to run dvc.commitTarget without error', async () => {
      const mockCommitTarget = stub(
        CliExecutor.prototype,
        'commitTarget'
      ).resolves('')

      await commands.executeCommand('dvc.commitTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockCommitTarget).to.be.calledOnce
    })

    it('should prompt to force if dvc.commitTarget fails', async () => {
      stub(CliExecutor.prototype, 'commitTarget').rejects({
        stderr: Prompt.TRY_FORCE
      })
      const mockShowInformationMessage = stub(
        window,
        'showWarningMessage'
      ).resolves(('Force' as unknown) as MessageItem)
      const mockForceCommit = stub(
        CliExecutor.prototype,
        'forceCommitTarget'
      ).resolves('')

      await commands.executeCommand('dvc.commitTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri
      })

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockForceCommit).to.be.calledOnce
    })

    it('should not prompt to force if dvc.pull fails without a prompt error', async () => {
      const mockPull = stub(CliExecutor.prototype, 'pull').rejects(
        'The remote has gone away'
      )
      const mockShowErrorMessage = stub(window, 'showErrorMessage').resolves(
        ('' as unknown) as MessageItem
      )
      const mockForcePull = stub(CliExecutor.prototype, 'forcePull').resolves(
        ''
      )

      await commands.executeCommand('dvc.pull', { rootUri })

      expect(mockPull).to.be.calledOnce
      expect(mockShowErrorMessage).to.be.calledOnce
      expect(mockForcePull).not.to.be.called
    })

    it('should not prompt to force if dvc.push fails without a prompt error', async () => {
      const mockPush = stub(CliExecutor.prototype, 'push').rejects(
        'The remote has gone away'
      )
      const mockShowErrorMessage = stub(window, 'showErrorMessage').resolves(
        ('' as unknown) as MessageItem
      )
      const mockForcePush = stub(CliExecutor.prototype, 'forcePush').resolves(
        ''
      )

      await commands.executeCommand('dvc.push', { rootUri })

      expect(mockPush).to.be.calledOnce
      expect(mockShowErrorMessage).to.be.calledOnce
      expect(mockForcePush).not.to.be.called
    })
  })
})
