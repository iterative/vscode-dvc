import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy, SinonStub } from 'sinon'
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

suite('Extension Test Suite', () => {
  window.showInformationMessage('Start all extension tests.')

  const dvcPathOption = 'dvc.dvcPath'
  const pythonPathOption = 'dvc.pythonPath'

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return Promise.all([
      workspace.getConfiguration().update(dvcPathOption, undefined, false),
      workspace.getConfiguration().update(pythonPathOption, undefined, false),
      commands.executeCommand('workbench.action.closeAllEditors')
    ])
  })

  describe('dvc.setupWorkspace', () => {
    const configurationChangeEvent = (option = dvcPathOption) =>
      new Promise(resolve => {
        const listener: Disposable = workspace.onDidChangeConfiguration(
          (event: ConfigurationChangeEvent) => {
            if (event.affectsConfiguration(option)) {
              resolve(event)
            }
          }
        )
        disposable.track(listener)
      })

    const quickPickInitialized = (mockShowQuickPick: SinonStub, call: number) =>
      new Promise(resolve => {
        mockShowQuickPick.onCall(call).callsFake((items, options) =>
          mockShowQuickPick.wrappedMethod(items, {
            ...options,
            onDidSelectItem: (item: unknown) => {
              resolve(item)
              options?.onDidSelectItem
            }
          })
        )
      })

    const onDidChangeFileSystemEvent = () =>
      new Promise(resolve =>
        stub(Watcher, 'onDidChangeFileSystem').callsFake(() => {
          resolve(undefined)
          return {
            dispose: () => undefined
          } as Disposable
        })
      )

    const selectDvcPathFromFilePicker = async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')

      const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)
      const globalQuickPickActive = quickPickInitialized(mockShowQuickPick, 1)

      const setupWorkspaceWizard = commands.executeCommand('dvc.setupWorkspace')
      await venvQuickPickActive

      await commands.executeCommand('workbench.action.quickOpenSelectNext')
      await commands.executeCommand('workbench.action.quickOpenSelectNext')
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await globalQuickPickActive
      mockShowQuickPick.restore()

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
      const mockShowQuickPick = stub(window, 'showQuickPick')
      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      await workspace.getConfiguration().update(dvcPathOption, '/fun')

      const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)
      const dvcInVenvQuickPickActive = quickPickInitialized(
        mockShowQuickPick,
        1
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

    it('should set dvc.pythonPath to the picked value when the user selects to pick a Python interpreter', async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockPath = resolve('file', 'picked', 'path', 'to', 'python')
      stub(window, 'showOpenDialog').resolves([Uri.file(mockPath)])
      const pythonChanged = configurationChangeEvent('dvc.pythonPath')

      const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)
      const globalQuickPickActive = quickPickInitialized(mockShowQuickPick, 1)

      const setupWorkspaceWizard = commands.executeCommand('dvc.setupWorkspace')

      await venvQuickPickActive

      await commands.executeCommand('workbench.action.quickOpenSelectNext')
      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await globalQuickPickActive

      await commands.executeCommand(
        'workbench.action.acceptSelectedQuickOpenItem'
      )

      await pythonChanged

      await setupWorkspaceWizard

      expect(workspace.getConfiguration().get('dvc.pythonPath')).to.equal(
        mockPath
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

      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const onDidChangeFileSystemCalled = onDidChangeFileSystemEvent()

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

      await onDidChangeFileSystemCalled

      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
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

      const onDidChangeFileSystemCalled = onDidChangeFileSystemEvent()

      const mockDisposer = spy(Disposer, 'reset')

      const mockListDvcOnlyRecursive = stub(
        CliReader.prototype,
        'listDvcOnlyRecursive'
      ).resolves([])

      stub(CliReader.prototype, 'listDvcOnly').resolves([])

      const mockDiff = stub(CliReader.prototype, 'diff').resolves({})

      const mockStatus = stub(CliReader.prototype, 'status').resolves({})

      await selectDvcPathFromFilePicker()

      await onDidChangeFileSystemCalled

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
