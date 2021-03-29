import { describe, it, before, beforeEach } from 'mocha'
import chai from 'chai'
import { stub, spy } from 'sinon'
import sinonChai from 'sinon-chai'
import { window, commands, workspace, Uri } from 'vscode'
import { join, resolve } from 'path'
import * as DvcReader from '../../cli/reader'
import * as FileSystem from '../../fileSystem'
import complexExperimentsOutput from '../../webviews/experiments/complex-output-example.json'
import { ExperimentsWebview } from '../../webviews/experiments/ExperimentsWebview'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all extension tests.')

  before(() => {
    stub(DvcReader, 'listDvcOnlyRecursive').resolves([
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
      join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
      join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
      join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
      join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
      join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
      join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
      join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
      join('logs', 'acc.tsv'),
      join('logs', 'loss.tsv'),
      'model.pt'
    ])
  })

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

      expect(windowSpy).to.have.been.calledOnce
      expect(mockReader).to.have.been.calledOnce

      windowSpy.resetHistory()
      mockReader.resetHistory()

      await commands.executeCommand('workbench.action.previousEditor')
      expect(window.activeTextEditor?.document).to.deep.equal(document)

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
})
