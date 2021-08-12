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
import { QuickPickItemWithValue } from '../../vscode/quickPick'

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
    const configurationChangeEvent = () =>
      new Promise(resolve => {
        const listener: Disposable = workspace.onDidChangeConfiguration(
          (event: ConfigurationChangeEvent) => {
            if (event.affectsConfiguration(dvcPathOption)) {
              delay(200).then(() => resolve(event))
            }
          }
        )
        disposable.track(listener)
      })

    const selectDvcPathFromFilePicker = async () => {
      const venvQuickPick = window.createQuickPick<QuickPickItemWithValue>()
      const isAvailableGloballyQuickPick =
        window.createQuickPick<QuickPickItemWithValue>()

      const mockCreateQuickPick = stub(window, 'createQuickPick')
        .onFirstCall()
        .returns(venvQuickPick)
        .onSecondCall()
        .returns(isAvailableGloballyQuickPick)

      const venvQuickPickActive = new Promise(resolve =>
        venvQuickPick.onDidChangeActive(e => resolve(e))
      )
      const globalQuickPickActive = new Promise(resolve =>
        isAvailableGloballyQuickPick.onDidChangeActive(e => resolve(e))
      )

      const setupWorkspaceWizard = commands.executeCommand('dvc.setupWorkspace')
      await venvQuickPickActive

      await commands.executeCommand('workbench.action.quickOpenSelectNext')
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await globalQuickPickActive
      mockCreateQuickPick.restore()

      await commands.executeCommand('workbench.action.quickOpenSelectNext')
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await configurationChangeEvent()

      return setupWorkspaceWizard
    }

    it('should set dvc.dvcPath to the default when dvc is installed in a virtual environment', async () => {
      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      await workspace.getConfiguration().update(dvcPathOption, '/fun')

      const venvQuickPick = window.createQuickPick<QuickPickItemWithValue>()
      const isDVCInVenvQuickPick =
        window.createQuickPick<QuickPickItemWithValue>()

      stub(window, 'createQuickPick')
        .onFirstCall()
        .returns(venvQuickPick)
        .onSecondCall()
        .returns(isDVCInVenvQuickPick)

      const venvQuickPickActive = new Promise(resolve =>
        venvQuickPick.onDidChangeActive(e => resolve(e))
      )
      const dvcInVenvQuickPickActive = new Promise(resolve =>
        isDVCInVenvQuickPick.onDidChangeActive(e => resolve(e))
      )

      const setupWorkspaceWizard = commands.executeCommand('dvc.setupWorkspace')
      await venvQuickPickActive

      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )
      await dvcInVenvQuickPickActive
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await setupWorkspaceWizard

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        null
      )
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

      await selectDvcPathFromFilePicker()

      expect(mockShowOpenDialog).to.be.calledOnce

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

      await selectDvcPathFromFilePicker()

      expect(mockShowOpenDialog).to.be.calledOnce
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

      await selectDvcPathFromFilePicker()

      expect(mockShowOpenDialog).to.be.calledOnce

      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockDisposer).to.have.been.called
    })
  })
})
