import { describe, it, beforeEach } from 'mocha'
import chai from 'chai'
import { stub, spy } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, workspace, Uri } from 'vscode'
import { join, resolve } from 'path'
import * as DvcReader from '../../cli/reader'
import * as FileSystem from '../../fileSystem'
import complexExperimentsOutput from '../../webviews/experiments/complex-output-example.json'
import { ExperimentsWebview } from '../../webviews/experiments/ExperimentsWebview'
import * as util from '../../util'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', async () => {
  window.showInformationMessage('Start all extension tests.')

  const demoFolderLocation = resolve(__dirname, '..', '..', '..', '..', 'demo')

  beforeEach(async () => {
    await workspace.getConfiguration().update('dvc.dvcPath', undefined, false)
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('dvc.showExperiments', () => {
    it('should be able to make the experiments webview visible', async () => {
      const mockReader = stub(DvcReader, 'getExperiments').resolves(
        complexExperimentsOutput
      )

      const experimentsWebview = (await commands.executeCommand(
        'dvc.showExperiments'
      )) as ExperimentsWebview

      expect(experimentsWebview.isActive()).to.be.true
      expect(experimentsWebview.isVisible()).to.be.true

      mockReader.restore()
      experimentsWebview.dispose()
    })

    it('should only be able to open a single experiments webview', async () => {
      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(demoFolderLocation, 'train.py'))

      const mockReader = stub(DvcReader, 'getExperiments').resolves(
        complexExperimentsOutput
      )

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const experimentsWebview = (await commands.executeCommand(
        'dvc.showExperiments'
      )) as ExperimentsWebview

      expect(experimentsWebview.isActive()).to.be.true
      expect(experimentsWebview.isVisible()).to.be.true

      expect(windowSpy).to.have.been.calledOnce
      expect(mockReader).to.have.been.calledOnce

      windowSpy.resetHistory()
      mockReader.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

      expect(experimentsWebview.isActive()).to.be.false

      const sameWebview = await commands.executeCommand('dvc.showExperiments')

      expect(experimentsWebview === sameWebview).to.be.true

      expect(windowSpy).not.to.have.been.called
      expect(mockReader).to.have.been.calledOnce

      windowSpy.restore()
      mockReader.restore()
      experimentsWebview.dispose()
    })
  })

  describe('dvc.selectDvcPath', () => {
    it('should be able to select the default path (global installation) of the dvc cli', async () => {
      const cli = 'dvc'
      const mockFindCliPath = stub(FileSystem, 'findCliPath').resolves(cli)
      const mockFindDvcRoots = stub(FileSystem, 'findDvcRootPaths').resolves([
        demoFolderLocation
      ])

      const selectDefaultPathInUI = async () => {
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
        await commands.executeCommand(
          'workbench.action.acceptSelectedQuickOpenItem'
        )
      }

      const mockShowInputBox = stub(window, 'showInputBox')

      const defaultPath = commands.executeCommand('dvc.selectDvcPath')
      await selectDefaultPathInUI()

      expect(await defaultPath).to.equal('dvc')
      expect(await workspace.getConfiguration().get('dvc.dvcPath')).to.equal(
        'dvc'
      )

      expect(mockFindCliPath).to.have.been.calledWith(demoFolderLocation, cli)
      expect(mockFindDvcRoots).to.have.been.calledWith(demoFolderLocation, cli)
      expect(mockShowInputBox).not.to.have.been.called

      mockFindCliPath.restore()
      mockFindDvcRoots.restore()
      mockShowInputBox.restore()
    })

    it('should be able to select a custom path for the dvc cli', async () => {
      const customPath = join('custom', 'path', 'to', 'dvc')
      const mockFindCliPath = stub(FileSystem, 'findCliPath').resolves(
        customPath
      )
      const mockFindDvcRoots = stub(FileSystem, 'findDvcRootPaths').resolves([
        demoFolderLocation
      ])
      const selectCustomPathInUI = async () => {
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
        await commands.executeCommand(
          'workbench.action.acceptSelectedQuickOpenItem'
        )
      }

      const mockShowInputBox = stub(window, 'showInputBox').resolves(customPath)

      const selectedCustomPath = commands.executeCommand('dvc.selectDvcPath')
      await selectCustomPathInUI()

      expect(await selectedCustomPath).to.equal(customPath)
      expect(await workspace.getConfiguration().get('dvc.dvcPath')).to.equal(
        customPath
      )

      expect(mockFindCliPath).to.have.been.calledWith(
        demoFolderLocation,
        customPath
      )
      expect(mockFindDvcRoots).to.have.been.calledWith(
        demoFolderLocation,
        customPath
      )
      expect(mockShowInputBox).to.have.been.calledOnce

      mockFindCliPath.restore()
      mockFindDvcRoots.restore()
      mockShowInputBox.restore()
    })
  })

  describe('getExperiments', () => {
    it('should match a snapshot when parsed', async () => {
      const cwd = resolve()
      const mockedExecPromise = stub(util, 'execPromise').resolves({
        stdout: JSON.stringify(complexExperimentsOutput),
        stderr: ''
      })

      await DvcReader.getExperiments({
        cliPath: 'dvc',
        cwd
      })
      expect(mockedExecPromise).to.have.been.calledWith(
        'dvc exp show --show-json',
        {
          cwd
        }
      )
      mockedExecPromise.restore()
    })
  })

  describe('getRoot', () => {
    it('should return the root relative to the cwd', async () => {
      const mockedExecPromise = stub(util, 'execPromise').resolves({
        stdout: JSON.stringify(complexExperimentsOutput),
        stderr: ''
      })

      const mockRelativeRoot = join('..', '..')
      const mockStdout = mockRelativeRoot + '\n\r'
      const cwd = resolve()
      mockedExecPromise.resolves({
        stdout: mockStdout,
        stderr: ''
      })

      const relativeRoot = await DvcReader.getRoot({
        cwd,
        cliPath: 'dvc'
      })
      expect(relativeRoot).to.equal(mockRelativeRoot)
      expect(mockedExecPromise).to.have.been.calledWith('dvc root', {
        cwd
      })
      mockedExecPromise.restore()
    })
  })
})
