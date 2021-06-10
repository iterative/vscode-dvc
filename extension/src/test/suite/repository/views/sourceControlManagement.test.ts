import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, Uri } from 'vscode'
import { Disposable } from '../../../../extension'
import * as Process from '../../../../processExecution'

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
    it('should be able to run dvc.commit without error', async () => {
      const uri = Uri.file(join(dvcDemoPath))

      const mockProcess = stub(Process, 'executeProcess').resolves('')

      await commands.executeCommand('dvc.commit', { rootUri: uri })

      expect(mockProcess).to.be.calledOnce
      expect(mockProcess).to.be.calledWith({
        args: ['commit'],
        cwd: dvcDemoPath,
        env: process.env,
        executable: 'dvc'
      })
    })

    it('should be able to run dvc.checkoutTarget without error', async () => {
      const relPath = join('data', 'MNIST')
      const uri = Uri.file(join(dvcDemoPath, relPath))

      const mockProcess = stub(Process, 'executeProcess').resolves('')

      await commands.executeCommand('dvc.checkoutTarget', {
        dvcRoot: dvcDemoPath,
        resourceUri: uri
      })

      expect(mockProcess).to.be.calledOnce
      expect(mockProcess).to.be.calledWith({
        args: ['checkout', relPath],
        cwd: dvcDemoPath,
        env: process.env,
        executable: 'dvc'
      })
    })
  })
})
