import { join } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import chai from 'chai'
import { stub, restore } from 'sinon'
import sinonChai from 'sinon-chai'
import {
  window,
  commands,
  workspace,
  Uri,
  ConfigurationChangeEvent
} from 'vscode'
import { Disposable } from '../../extension'
import { CliReader, ListOutput, StatusOutput } from '../../cli/reader'
import { CliExecutor } from '../../cli/executor'
import * as Watcher from '../../fileSystem/watcher'
import complexExperimentsOutput from '../../experiments/webview/complex-output-example.json'

chai.use(sinonChai)
const { expect } = chai

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all extension tests.')

  const dvcPathOption = 'dvc.dvcPath'

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(async () => {
    disposable.dispose()
    await workspace.getConfiguration().update(dvcPathOption, undefined, false)
    return commands.executeCommand('workbench.action.closeAllEditors')
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
      const mockCanRunCli = stub(CliExecutor.prototype, 'help').rejects('ERROR')
      await selectDvcPathItem(0)
      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal('')

      expect(mockShowInputBox).not.to.have.been.called
      expect(mockCanRunCli).to.have.been.called
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

    it('should invoke the file picker with the second option and initialize the extension when the cli is usable', async () => {
      const testUri = Uri.file('/file/picked/path/to/dvc')
      const fileResolve = [testUri]
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves(
        fileResolve
      )
      const mockCanRunCli = stub(CliExecutor.prototype, 'help').resolves(
        'I WORK NOW'
      )

      const mockOnDidChangeFileSystem = stub(
        Watcher,
        'onDidChangeFileSystem'
      ).returns({
        dispose: () => undefined
      } as Disposable)

      const mockListDvcOnlyRecursive = stub(
        CliReader.prototype,
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
      ] as ListOutput[])

      stub(CliReader.prototype, 'listDvcOnly').resolves([
        { isdir: true, isexec: false, isout: false, path: 'data' },
        { isdir: true, isexec: false, isout: true, path: 'logs' },
        { isdir: false, isexec: false, isout: true, path: 'model.pt' }
      ])

      stub(CliReader.prototype, 'root').resolves('.')

      const mockDiff = stub(CliReader.prototype, 'diff').resolves({
        modified: [
          { path: 'model.pt' },
          { path: 'logs' },
          { path: 'data/MNIST/raw' }
        ]
      })

      const mockStatus = stub(CliReader.prototype, 'status').resolves(({
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ],
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { logs: 'modified', 'model.pt': 'modified' } },
          'always changed'
        ]
      } as unknown) as StatusOutput)

      await selectDvcPathItem(1)

      await configurationChangeEvent()

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        testUri.fsPath
      )

      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockOnDidChangeFileSystem).to.have.been.called
      expect(mockListDvcOnlyRecursive).to.have.been.called
      expect(mockDiff).to.have.been.called
      expect(mockStatus).to.have.been.called
    })

    it('should not create a second set of repositories if they have already been created', async () => {
      const testUri = Uri.file('/file/picked/path/to/dvc')
      const fileResolve = [testUri]
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves(
        fileResolve
      )
      const mockCanRunCli = stub(CliExecutor.prototype, 'help').resolves(
        'I STILL WORK'
      )

      stub(Watcher, 'onDidChangeFileSystem').returns({} as Disposable)

      const mockListDvcOnlyRecursive = stub(
        CliReader.prototype,
        'listDvcOnlyRecursive'
      ).resolves([])

      stub(CliReader.prototype, 'listDvcOnly').resolves([])

      stub(CliReader.prototype, 'root').resolves('.')

      const mockDiff = stub(CliReader.prototype, 'diff').resolves({})

      const mockStatus = stub(CliReader.prototype, 'status').resolves({})

      await selectDvcPathItem(1)

      await configurationChangeEvent()

      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockListDvcOnlyRecursive).not.to.have.been.called
      expect(mockDiff).not.to.have.been.called
      expect(mockStatus).not.to.have.been.called
    })
  })
})
