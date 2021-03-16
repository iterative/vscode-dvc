import { describe, it, beforeEach } from 'mocha'
import chai from 'chai'
import { stub } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, workspace } from 'vscode'
import { join } from 'path'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all extension tests.')

  beforeEach(async () => {
    await workspace.getConfiguration().update('dvc.dvcPath', undefined, false)
  })

  describe('dvc binary path picker', () => {
    it('should be able to select the default dvc path', async () => {
      const selectDefaultPathInUI = async () => {
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
        await commands.executeCommand(
          'workbench.action.acceptSelectedQuickOpenItem'
        )
      }

      const mockShowInputBox = stub(window, 'showInputBox')

      const defaultPath = commands.executeCommand('dvc.selectDvcPath')
      await selectDefaultPathInUI()

      expect(mockShowInputBox).not.to.have.been.called
      expect(await defaultPath).to.equal('dvc')
      expect(await workspace.getConfiguration().get('dvc.dvcPath')).to.equal(
        'dvc'
      )

      mockShowInputBox.restore()
    })

    it('should be able to select a custom path for the dvc binary', async () => {
      const selectCustomPathInUI = async () => {
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
        await commands.executeCommand(
          'workbench.action.acceptSelectedQuickOpenItem'
        )
      }

      const customPath = join('custom', 'path', 'to', 'dvc')
      const mockShowInputBox = stub(window, 'showInputBox').resolves(customPath)

      const selectedCustomPath = commands.executeCommand('dvc.selectDvcPath')
      await selectCustomPathInUI()

      expect(await selectedCustomPath).to.equal(customPath)
      expect(await workspace.getConfiguration().get('dvc.dvcPath')).to.equal(
        customPath
      )
      expect(mockShowInputBox).to.have.been.calledOnce

      mockShowInputBox.restore()
    })
  })
})
