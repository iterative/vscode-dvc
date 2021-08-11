import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy } from 'sinon'
import {
  window,
  commands,
  workspace,
  Uri,
  ConfigurationChangeEvent
} from 'vscode'
import { Disposable } from '../../extension'
import { CliReader, ListOutput, StatusOutput } from '../../cli/reader'
import * as Watcher from '../../fileSystem/watcher'
import complexExperimentsOutput from '../../experiments/webview/complex-output-example.json'
import * as Disposer from '../../util/disposable'
import { delay } from '../../util/time'

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

  describe('dvc.setupWorkspace', () => {
    const selectDvcPathFromFilePicker = async () => {
      const selectionPromise = commands.executeCommand('dvc.setupWorkspace')

      await delay(200)

      await commands.executeCommand('workbench.action.quickOpenNavigateNext')
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await delay(200)
      await commands.executeCommand('workbench.action.quickOpenNavigateNext')
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await selectionPromise
    }

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

    it('should set dvc.dvcPath to the default when dvc is installed in a virtual environment', async () => {
      const mockShowInputBox = stub(window, 'showInputBox')

      const selectionPromise = commands.executeCommand('dvc.setupWorkspace')

      await delay(200)
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )
      await delay(200)
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await selectionPromise

      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        null
      )

      expect(mockShowInputBox).not.to.have.been.called
    })

    it('should invoke the file picker with the second option and initialize the extension when the cli is usable', async () => {
      const mockPath = resolve('file', 'picked', 'path', 'to', 'dvc')
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves([
        Uri.file(mockPath)
      ])
      const mockCanRunCli = stub(CliReader.prototype, 'help').resolves(
        'I WORK NOW'
      )

      const mockOnDidChangeFileSystem = stub(
        Watcher,
        'onDidChangeFileSystem'
      ).returns({
        dispose: () => undefined
      } as Disposable)

      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      stub(CliReader.prototype, 'listDvcOnlyRecursive').resolves([
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

      const mockStatus = stub(CliReader.prototype, 'status').resolves({
        'data/MNIST/raw.dvc': [
          { 'changed outs': { 'data/MNIST/raw': 'modified' } }
        ],
        train: [
          { 'changed deps': { 'data/MNIST': 'modified' } },
          { 'changed outs': { logs: 'modified', 'model.pt': 'modified' } },
          'always changed'
        ]
      } as unknown as StatusOutput)

      const configChanged = configurationChangeEvent()
      await selectDvcPathFromFilePicker()

      expect(mockShowOpenDialog).to.be.calledOnce

      await configChanged
      await delay(200)

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        mockPath
      )

      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockOnDidChangeFileSystem).to.have.been.called
      expect(mockDiff).to.have.been.called
      expect(mockStatus).to.have.been.called
    })

    it('should dispose of the current repositories and experiments before creating new ones', async () => {
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves([
        Uri.file(resolve('different', 'file', 'picked', 'path', 'to', 'dvc'))
      ])
      const mockCanRunCli = stub(CliReader.prototype, 'help').resolves(
        'I STILL WORK'
      )

      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      stub(Watcher, 'onDidChangeFileSystem').returns({
        dispose: () => undefined
      } as Disposable)

      const mockDisposer = spy(Disposer, 'reset')

      const mockListDvcOnlyRecursive = stub(
        CliReader.prototype,
        'listDvcOnlyRecursive'
      ).resolves([])

      stub(CliReader.prototype, 'listDvcOnly').resolves([])

      const mockDiff = stub(CliReader.prototype, 'diff').resolves({})

      const mockStatus = stub(CliReader.prototype, 'status').resolves({})

      const configChanged = configurationChangeEvent()

      await selectDvcPathFromFilePicker()

      expect(mockShowOpenDialog).to.be.calledOnce

      await configChanged
      await delay(200)

      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockDisposer).to.have.been.called
      expect(mockListDvcOnlyRecursive).to.have.been.called
      expect(mockDiff).to.have.been.called
      expect(mockStatus).to.have.been.called
    })

    it('should dispose of the current repositories and experiments if the cli can no longer be found', async () => {
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves([
        Uri.file(resolve('path', 'to', 'dvc'))
      ])
      const mockCanRunCli = stub(CliReader.prototype, 'help').rejects(
        'GONE AGAIN'
      )

      const mockDisposer = spy(Disposer, 'reset')

      const configChanged = configurationChangeEvent()

      await selectDvcPathFromFilePicker()

      expect(mockShowOpenDialog).to.be.calledOnce

      await configChanged
      await delay(200)

      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockDisposer).to.have.been.called
    })
  })
})
