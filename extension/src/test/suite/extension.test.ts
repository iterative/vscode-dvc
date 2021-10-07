import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy, useFakeTimers } from 'sinon'
import { window, commands, workspace, Uri, FileSystemWatcher } from 'vscode'
import {
  configurationChangeEvent,
  quickPickInitialized,
  selectQuickPickItem
} from './util'
import { Disposable, Extension } from '../../extension'
import { CliReader, ListOutput, StatusOutput } from '../../cli/reader'
import * as Watcher from '../../fileSystem/watcher'
import complexExperimentsOutput from '../fixtures/complex-output-example'
import * as Disposer from '../../util/disposable'
import { RegisteredCommands } from '../../commands/external'
import * as Setup from '../../setup'
import * as Telemetry from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import * as Context from '../../vscode/context'

suite('Extension Test Suite', () => {
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
    const createFileSystemWatcherEvent = () =>
      new Promise(resolve =>
        stub(Watcher, 'createFileSystemWatcher').callsFake(() => {
          resolve(undefined)
          return { dispose: stub() } as unknown as FileSystemWatcher
        })
      )

    const selectDvcPathFromFilePicker = async () => {
      const mockShowQuickPick = stub(window, 'showQuickPick')

      const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)
      const globalQuickPickActive = quickPickInitialized(mockShowQuickPick, 1)

      const setupWorkspaceWizard = commands.executeCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE
      )
      await venvQuickPickActive

      const selectNoVenv = selectQuickPickItem(3)
      await selectNoVenv

      await globalQuickPickActive
      mockShowQuickPick.restore()

      const selectNotGlobal = selectQuickPickItem(2)
      await selectNotGlobal

      const selectToFindCLI = selectQuickPickItem(1)
      await selectToFindCLI
      await configurationChangeEvent(dvcPathOption, disposable)

      return setupWorkspaceWizard
    }

    it('should set dvc.commands.available to false if there is not a folder in the workspace (no cwd)', async () => {
      stub(workspace, 'workspaceFolders').returns(undefined)

      const initializeSpy = spy(Extension.prototype, 'initialize')
      const mockCanRunCliSpy = stub(Extension.prototype, 'canRunCli')
      const mockSetContextValue = stub(Context, 'setContextValue')
      const contextValueSet = new Promise(resolve =>
        mockSetContextValue
          .onFirstCall()
          .resolves(undefined)
          .onSecondCall()
          .callsFake(() => {
            resolve(undefined)
            return Promise.resolve(false)
          })
      )

      await workspace.getConfiguration().update(dvcPathOption, 'dvc')
      await contextValueSet

      expect(initializeSpy).not.to.be.called
      expect(mockCanRunCliSpy).to.have.been.calledOnce
      expect(mockSetContextValue).to.have.been.calledTwice
      expect(mockSetContextValue).to.have.been.calledWith(
        'dvc.commands.available',
        false
      )
      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        'dvc'
      )
    })

    it('should set dvc.dvcPath to the default when dvc is installed in a virtual environment', async () => {
      stub(CliReader.prototype, 'help').rejects('do not run setup')

      const mockShowQuickPick = stub(window, 'showQuickPick')

      await workspace.getConfiguration().update(dvcPathOption, '/fun')

      const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)
      const dvcInVenvQuickPickActive = quickPickInitialized(
        mockShowQuickPick,
        1
      )

      const setupWorkspaceWizard = commands.executeCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE
      )
      await venvQuickPickActive

      const selectVenvAndUseExtension = selectQuickPickItem(1)
      await selectVenvAndUseExtension

      await dvcInVenvQuickPickActive

      const selectDVCInVenv = selectQuickPickItem(1)
      await selectDVCInVenv

      await setupWorkspaceWizard

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        null
      )
    })

    it('should set dvc.pythonPath to the picked value when the user selects to pick a Python interpreter', async () => {
      stub(CliReader.prototype, 'help').rejects('still do not run setup')

      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockUri = Uri.file(
        resolve('file', 'picked', 'path', 'to', 'python')
      )
      const mockPath = mockUri.fsPath
      stub(window, 'showOpenDialog').resolves([mockUri])
      const pythonChanged = configurationChangeEvent(
        pythonPathOption,
        disposable
      )

      const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)
      const globalQuickPickActive = quickPickInitialized(mockShowQuickPick, 1)

      const setupWorkspaceWizard = commands.executeCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE
      )

      await venvQuickPickActive

      const selectVenvAndInterpreter = selectQuickPickItem(2)
      await selectVenvAndInterpreter

      const selectToFindInterpreter = selectQuickPickItem(1)
      await selectToFindInterpreter

      await globalQuickPickActive

      const selectDVCInVenv = selectQuickPickItem(1)
      await selectDVCInVenv

      await pythonChanged

      await setupWorkspaceWizard

      expect(workspace.getConfiguration().get(pythonPathOption)).to.equal(
        mockPath
      )
    })

    it('should invoke the file picker with the second option and initialize the extension when the cli is usable', async () => {
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const secondTelemetryEventSent = new Promise(resolve =>
        mockSendTelemetryEvent
          .onFirstCall()
          .returns(undefined)
          .onSecondCall()
          .callsFake(() => {
            resolve(undefined)
            return undefined
          })
      )
      const mockUri = Uri.file(resolve('file', 'picked', 'path', 'to', 'dvc'))
      const mockPath = mockUri.fsPath
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves([
        mockUri
      ])
      const mockCanRunCli = stub(CliReader.prototype, 'help').resolves(
        'I WORK NOW'
      )

      stub(CliReader.prototype, 'diffParams').resolves({ params: {} })

      stub(CliReader.prototype, 'diffMetrics').resolves({ metrics: {} })

      stub(CliReader.prototype, 'experimentShow').resolves(
        complexExperimentsOutput
      )

      const createFileSystemWatcherCalled = createFileSystemWatcherEvent()

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

      await createFileSystemWatcherCalled
      await secondTelemetryEventSent

      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockDiff).to.have.been.called
      expect(mockStatus).to.have.been.called

      const [eventName, customProperties] =
        mockSendTelemetryEvent.getCall(1).args

      expect(
        eventName,
        'the correct execution details changed event should be sent'
      ).to.equal(EventName.EXTENSION_EXECUTION_DETAILS_CHANGED)
      expect(
        customProperties,
        'the correct custom properties should be sent with the event'
      ).to.deep.equal({
        cliAccessible: true,
        dvcPathUsed: true,
        dvcRootCount: 1,
        msPythonInstalled: false,
        msPythonUsed: false,
        pythonPathUsed: false,
        workspaceFolderCount: 1
      })
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

      const createFileSystemWatcherCalled = createFileSystemWatcherEvent()

      const mockDisposer = spy(Disposer, 'reset')

      stub(CliReader.prototype, 'diffParams').resolves({ params: {} })

      stub(CliReader.prototype, 'diffMetrics').resolves({ metrics: {} })

      stub(CliReader.prototype, 'listDvcOnlyRecursive').resolves([])

      stub(CliReader.prototype, 'listDvcOnly').resolves([])

      stub(CliReader.prototype, 'diff').resolves({})

      stub(CliReader.prototype, 'status').resolves({})

      await selectDvcPathFromFilePicker()

      await createFileSystemWatcherCalled

      expect(mockShowOpenDialog).to.be.calledOnce
      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockDisposer).to.have.been.called
    })

    it('should dispose of the current repositories and experiments if the cli can no longer be found', async () => {
      const mockShowOpenDialog = stub(window, 'showOpenDialog').resolves([
        Uri.file(resolve('path', 'to', 'dvc'))
      ])
      const mockCanRunCli = stub(CliReader.prototype, 'help').rejects(
        'GONE AGAIN'
      )

      const mockDisposer = stub(Disposer, 'reset')

      const disposalEvent = new Promise(resolve => {
        mockDisposer.callsFake((...args) => {
          resolve(undefined)
          return mockDisposer.wrappedMethod(...args)
        })
      })

      await selectDvcPathFromFilePicker()

      await disposalEvent

      expect(mockShowOpenDialog).to.be.calledOnce
      expect(mockShowOpenDialog).to.have.been.called
      expect(mockCanRunCli).to.have.been.called
      expect(mockDisposer).to.have.been.called
    })

    it('should send an error telemetry event when setupWorkspace fails', async () => {
      const clock = useFakeTimers()
      const mockErrorMessage = 'NOPE'
      stub(Setup, 'setupWorkspace').rejects(new Error(mockErrorMessage))
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      await expect(
        commands.executeCommand(RegisteredCommands.EXTENSION_SETUP_WORKSPACE)
      ).to.be.eventually.rejectedWith(Error)

      expect(mockSendTelemetryEvent).to.be.calledWith(
        `errors.${RegisteredCommands.EXTENSION_SETUP_WORKSPACE}`,
        { error: mockErrorMessage },
        { duration: 0 }
      )

      clock.restore()
    })
  })

  describe('dvc.stopRunningExperiment', () => {
    it('should send a telemetry event containing properties relating to the event', async () => {
      const clock = useFakeTimers()
      const duration = 1234
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      const stop = commands.executeCommand(RegisteredCommands.STOP_EXPERIMENT)
      clock.tick(duration)
      await stop

      expect(mockSendTelemetryEvent).to.be.calledWith(
        RegisteredCommands.STOP_EXPERIMENT,
        {
          stopped: false,
          wasRunning: false
        },
        {
          duration
        }
      )

      clock.restore()
    })
  })

  describe('dvc.showCommands', () => {
    it('should show all of the dvc commands without error', async () => {
      await expect(
        commands.executeCommand('dvc.showCommands')
      ).to.be.eventually.equal(undefined)
    })
  })

  describe('view container', () => {
    it('should be able to focus the experiments view container', async () => {
      await expect(
        commands.executeCommand('workbench.view.extension.dvc-views')
      ).to.be.eventually.equal(undefined)
    })
  })
})
