import { afterEach, before, describe, it } from 'mocha'
import chai from 'chai'
import { stub, spy } from 'sinon'
import sinonChai from 'sinon-chai'
import { join, resolve } from 'path'
import {
  window,
  commands,
  workspace,
  Uri,
  ConfigurationChangeEvent
} from 'vscode'
import { Disposable } from '../../extension'
import * as DvcReader from '../../cli/reader'
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
    stub(DvcReader, 'status').resolves({
      train: [
        { 'changed deps': { 'data/MNIST': 'modified' } },
        { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
        'always changed'
      ],
      'data/MNIST/raw.dvc': [
        { 'changed outs': { 'data/MNIST/raw': 'modified' } }
      ]
    })
  })

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', 'demo')

  afterEach(async () => {
    await workspace.getConfiguration().update('dvc.dvcPath', undefined, false)
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('dvc.showExperiments', () => {
    it('should be able to make the experiments webview visible', async () => {
      const mockReader = stub(DvcReader, 'experimentShow').resolves(
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
      const uri = Uri.file(resolve(dvcDemoPath, 'train.py'))

      const mockReader = stub(DvcReader, 'experimentShow').resolves(
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
    const selectDvcPathItem = async (selection: number) => {
      const selectionPromise = commands.executeCommand('dvc.selectDvcPath')

      for (let i = 0; i <= selection; i++) {
        await commands.executeCommand('workbench.action.quickOpenSelectNext')
      }
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )
      await selectionPromise
    }

    it('should set dvc.dvcPath to blank on the first option', async () => {
      const mockShowInputBox = stub(window, 'showInputBox')
      await selectDvcPathItem(0)

      expect(await workspace.getConfiguration().get('dvc.dvcPath')).to.equal('')

      expect(mockShowInputBox).not.to.have.been.called

      mockShowInputBox.restore()
    })

    it('should invoke the file picker with the second option', async () => {
      const disposable = Disposable.fn()
      const testUri = Uri.file('/file/picked/path/to/dvc')
      const fileResolve = [testUri]
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves(
        fileResolve
      )

      const configurationChangeEvent = () => {
        return new Promise(resolve => {
          const listener: Disposable = workspace.onDidChangeConfiguration(
            (event: ConfigurationChangeEvent) => {
              return resolve(event)
            }
          )
          disposable.track(listener)
        })
      }

      await selectDvcPathItem(1)

      expect(mockShowOpenDialog).to.have.been.called

      await configurationChangeEvent()

      expect(await workspace.getConfiguration().get('dvc.dvcPath')).to.equal(
        testUri.fsPath
      )

      mockShowOpenDialog.restore()
      disposable.dispose()
    })
  })
})
