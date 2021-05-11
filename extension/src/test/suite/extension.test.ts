import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, spy, restore } from 'sinon'
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
import * as CliReader from '../../cli/reader'
import * as CliExecutor from '../../cli/executor'
import * as FileSystem from '../../fileSystem'
import complexExperimentsOutput from '../../webviews/experiments/complex-output-example.json'
import { ExperimentsWebview } from '../../webviews/experiments/ExperimentsWebview'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all extension tests.')

  const dvcPathOption = 'dvc.dvcPath'

  const dvcDemoPath = resolve(__dirname, '..', '..', '..', '..', 'demo')

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(async () => {
    disposable.dispose()
    await workspace.getConfiguration().update(dvcPathOption, undefined, false)
    return commands.executeCommand('workbench.action.closeAllEditors')
  })

  describe('showExperiments', () => {
    const showExperimentsCommand = 'dvc.showExperiments'
    it('should be able to make the experiments webview visible', async () => {
      stub(CliReader, 'experimentShow').resolves(complexExperimentsOutput)

      const experimentsWebview = disposable.track(
        await commands.executeCommand(showExperimentsCommand)
      ) as ExperimentsWebview

      expect(experimentsWebview.isActive()).to.be.true
      expect(experimentsWebview.isVisible()).to.be.true
    })

    it('should only be able to open a single experiments webview', async () => {
      const windowSpy = spy(window, 'createWebviewPanel')
      const uri = Uri.file(resolve(dvcDemoPath, 'train.py'))

      const mockReader = stub(CliReader, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const document = await workspace.openTextDocument(uri)
      await window.showTextDocument(document)

      expect(window.activeTextEditor?.document).to.deep.equal(document)

      const experimentsWebview = disposable.track(
        await commands.executeCommand(showExperimentsCommand)
      ) as ExperimentsWebview

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
      const mockCanRunCli = stub(CliExecutor, 'canRunCli').rejects('ERROR')
      await selectDvcPathItem(0)
      stub(CliReader, 'experimentShow').resolves(complexExperimentsOutput)

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal('')

      expect(mockShowInputBox).not.to.have.been.called
      expect(mockCanRunCli).to.have.been.called
    })

    it('should invoke the file picker with the second option and initialize the extension when the cli is usable', async () => {
      const testUri = Uri.file('/file/picked/path/to/dvc')
      const fileResolve = [testUri]
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves(
        fileResolve
      )
      const mockCanRunCli = stub(CliExecutor, 'canRunCli').resolves(
        'I WORK NOW'
      )

      const mockHandleOnDidChangeSystem = stub(
        FileSystem,
        'onDidChangeFileSystem'
      ).returns({
        dispose: () => undefined
      } as Disposable)

      const mockHandleOnDidChangeType = stub(
        FileSystem,
        'onDidChangeFileType'
      ).returns({
        dispose: () => undefined
      } as Disposable)

      const mockListDvcOnlyRecursive = stub(
        CliReader,
        'listDvcOnlyRecursive'
      ).resolves([
        { path: join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte') },
        { path: join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz') },
        { path: join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte') },
        { path: join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz') },
        { path: join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte') },
        { path: join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz') },
        { path: join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte') },
        { path: join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz') },
        { path: join('logs', 'acc.tsv') },
        { path: join('logs', 'loss.tsv') },
        { path: 'model.pt' }
      ] as CliReader.ListOutput[])

      stub(CliReader, 'listDvcOnly').resolves([
        { isout: false, isdir: true, isexec: false, path: 'data' },
        { isout: true, isdir: true, isexec: false, path: 'logs' },
        { isout: true, isdir: false, isexec: false, path: 'model.pt' }
      ])

      const mockStatus = stub(CliReader, 'status').resolves({
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { 'model.pt': 'modified', logs: 'modified' } },
          'always changed'
        ],
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ]
      })

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
      expect(mockCanRunCli).to.have.been.called
      expect(mockHandleOnDidChangeSystem).to.have.been.called
      expect(mockHandleOnDidChangeType).to.have.been.called
      expect(mockListDvcOnlyRecursive).to.have.been.called
      expect(mockStatus).to.have.been.called

      await configurationChangeEvent()

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        testUri.fsPath
      )
    })
  })
})
