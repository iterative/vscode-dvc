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

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('SourceControlManagement', () => {
    it('should be able to run dvc.addTarget without error', async () => {
      const relPath = join('data', 'MNIST')
      const uri = Uri.file(join(dvcDemoPath, relPath))

      const mockAddTarget = stub(CliExecutor.prototype, 'addTarget').resolves(
        ''
      )

      await commands.executeCommand('dvc.addTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri: uri
      })

      expect(mockAddTarget).to.be.calledOnce
    })

    it('should be able to run dvc.commit without error', async () => {
      const uri = Uri.file(dvcDemoPath)

      const mockCommit = stub(CliExecutor.prototype, 'commit').resolves('')

      await commands.executeCommand('dvc.commit', { rootUri: uri })

      expect(mockCommit).to.be.calledOnce
    })

    it('should prompt to force if dvc.commit fails', async () => {
      const uri = Uri.file(dvcDemoPath)

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

      await commands.executeCommand('dvc.commit', { rootUri: uri })

      expect(mockShowInformationMessage).to.be.calledOnce
      expect(mockForceCommit).to.be.calledOnce
    })

    it('should be able to run dvc.commitTarget without error', async () => {
      const relPath = join('data', 'MNIST')
      const uri = Uri.file(join(dvcDemoPath, relPath))

      const mockCommitTarget = stub(
        CliExecutor.prototype,
        'commitTarget'
      ).resolves('')

      await commands.executeCommand('dvc.commitTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri: uri
      })

      expect(mockCommitTarget).to.be.calledOnce
    })

    it('should be able to run dvc.checkoutTarget without error', async () => {
      const relPath = join('data', 'MNIST')
      const uri = Uri.file(join(dvcDemoPath, relPath))

      const mockCheckout = stub(
        CliExecutor.prototype,
        'checkoutTarget'
      ).resolves('')

      await commands.executeCommand('dvc.checkoutTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri: uri
      })

      expect(mockCheckout).to.be.calledOnce
    })
  })
})
