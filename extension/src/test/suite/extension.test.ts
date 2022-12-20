import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy, match } from 'sinon'
import { window, commands, workspace, Uri } from 'vscode'
import {
  closeAllEditors,
  configurationChangeEvent,
  mockDisposable,
  mockDuration,
  quickPickInitialized,
  selectQuickPickItem
} from './util'
import { mockHasCheckpoints } from './experiments/util'
import { WEBVIEW_TEST_TIMEOUT } from './timeouts'
import { Disposable } from '../../extension'
import * as Python from '../../extensions/python'
import { DvcReader } from '../../cli/dvc/reader'
import expShowFixture from '../fixtures/expShow/base/output'
import plotsDiffFixture from '../fixtures/plotsDiff/output'
import * as Disposer from '../../util/disposable'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../commands/external'
import * as Setup from '../../setup'
import * as Watcher from '../../fileSystem/watcher'
import * as Telemetry from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { OutputChannel } from '../../vscode/outputChannel'
import { WorkspaceExperiments } from '../../experiments/workspace'
import { QuickPickItemWithValue } from '../../vscode/quickPick'
import { MIN_CLI_VERSION } from '../../cli/dvc/constants'
import * as WorkspaceFolders from '../../vscode/workspaceFolders'
import { DvcExecutor } from '../../cli/dvc/executor'
import { GitReader } from '../../cli/git/reader'
import { Config } from '../../config'
import { EXPERIMENT_WORKSPACE_ID } from '../../cli/dvc/contract'
import { ConfigKey, setConfigValue } from '../../vscode/config'

suite('Extension Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    disposable.dispose()
    return Promise.all([
      workspace.getConfiguration().update(ConfigKey.DVC_PATH, undefined, false),
      workspace
        .getConfiguration()
        .update(ConfigKey.PYTHON_PATH, undefined, false),
      closeAllEditors()
    ])
  })

  describe('dvc.setupWorkspace', () => {
    it('should set dvc.pythonPath to the picked value when the user selects to pick a Python interpreter', async () => {
      stub(DvcReader.prototype, 'version').rejects('do not initialize')
      stub(Python, 'isPythonExtensionInstalled').returns(false)

      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockUri = Uri.file(
        resolve('file', 'picked', 'path', 'to', 'python')
      )
      const mockPath = mockUri.fsPath
      stub(window, 'showOpenDialog').resolves([mockUri])
      const pythonChanged = configurationChangeEvent(
        ConfigKey.PYTHON_PATH,
        disposable
      )

      const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)

      const quickPick = window.createQuickPick<QuickPickItemWithValue<string>>()
      const mockCreateQuickPick = stub(window, 'createQuickPick').returns(
        quickPick
      )
      const pickOneOrInputActive = new Promise(resolve => {
        disposable.track(quickPick.onDidChangeActive(() => resolve(undefined)))
      })

      const setupWorkspaceWizard = commands.executeCommand(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE
      )

      await venvQuickPickActive

      const selectVenvAndInterpreter = selectQuickPickItem(1)
      await selectVenvAndInterpreter

      await pickOneOrInputActive
      mockCreateQuickPick.restore()

      const selectToFindInterpreter = selectQuickPickItem(1)
      await selectToFindInterpreter

      await pythonChanged

      await setupWorkspaceWizard

      expect(workspace.getConfiguration().get(ConfigKey.PYTHON_PATH)).to.equal(
        mockPath
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should initialize the extension when the cli is usable', async () => {
      stub(Python, 'isPythonExtensionInstalled').returns(true)
      const selectVirtualEnvWithPython = async (path: string) => {
        const mockShowQuickPick = stub(window, 'showQuickPick')

        const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)

        const setupWorkspaceWizard = commands.executeCommand(
          RegisteredCommands.EXTENSION_SETUP_WORKSPACE
        )

        const mockSelectPythonInterpreter = stub(
          Python,
          'selectPythonInterpreter'
        )
        const executeCommandCalled = new Promise(resolve =>
          mockSelectPythonInterpreter.callsFake(() => {
            setConfigValue(ConfigKey.PYTHON_PATH, path)
            resolve(undefined)
          })
        )

        await venvQuickPickActive

        await selectQuickPickItem(1)

        await executeCommandCalled

        mockSelectPythonInterpreter.restore()

        mockShowQuickPick.restore()

        return setupWorkspaceWizard
      }

      const mockCreateFileSystemWatcher = stub(
        workspace,
        'createFileSystemWatcher'
      ).returns({
        dispose: () => undefined,
        ignoreChangeEvents: false,
        ignoreCreateEvents: false,
        ignoreDeleteEvents: false,
        onDidChange: () => mockDisposable,
        onDidCreate: () => mockDisposable,
        onDidDelete: () => mockDisposable
      })

      const mockCanRunCli = stub(DvcReader.prototype, 'version')
        .onFirstCall()
        .resolves(MIN_CLI_VERSION)
        .onSecondCall()
        .rejects('CLI is gone, dispose of everything')

      const mockDisposer = stub(Disposer, 'reset')

      const disposalEvent = () =>
        new Promise(resolve => {
          mockDisposer.resetBehavior()
          mockDisposer.resetHistory()
          mockDisposer.callsFake((...args) => {
            resolve(undefined)
            return mockDisposer.wrappedMethod(...args)
          })
        })

      const firstDisposal = disposalEvent()

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const correctTelemetryEventSent = new Promise(resolve =>
        mockSendTelemetryEvent.callsFake((eventName: string) => {
          if (eventName === EventName.EXTENSION_EXECUTION_DETAILS_CHANGED) {
            resolve(undefined)
          }
        })
      )

      mockHasCheckpoints(expShowFixture)
      const mockExpShow = stub(DvcReader.prototype, 'expShow').resolves(
        expShowFixture
      )

      stub(DvcReader.prototype, 'root').resolves('.')

      const mockDataStatus = stub(DvcReader.prototype, 'dataStatus').resolves({
        committed: {
          added: [],
          deleted: [],
          modified: [],
          renamed: []
        },
        not_in_cache: [],
        unchanged: [
          join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte'),
          join('data', 'MNIST', 'raw', 't10k-images-idx3-ubyte.gz'),
          join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte'),
          join('data', 'MNIST', 'raw', 't10k-labels-idx1-ubyte.gz'),
          join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte'),
          join('data', 'MNIST', 'raw', 'train-images-idx3-ubyte.gz'),
          join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte'),
          join('data', 'MNIST', 'raw', 'train-labels-idx1-ubyte.gz'),
          join('logs', 'acc.tsv'),
          join('logs', 'loss.tsv')
        ],
        uncommitted: {
          added: [],
          deleted: [],
          modified: ['model.pt', join('data', 'MNIST', 'raw'), 'logs'],
          renamed: []
        }
      })

      stub(DvcReader.prototype, 'plotsDiff').resolves(plotsDiffFixture)

      const mockWorkspaceExperimentsReady = stub(
        WorkspaceExperiments.prototype,
        'isReady'
      )

      stub(GitReader.prototype, 'hasChanges').resolves(false)
      stub(GitReader.prototype, 'listUntracked').resolves(new Set())

      const workspaceExperimentsAreReady = new Promise(resolve =>
        mockWorkspaceExperimentsReady.callsFake(async () => {
          await mockWorkspaceExperimentsReady.wrappedMethod()
          resolve(undefined)
        })
      )

      const mockPath = resolve('path', 'to', 'venv')

      await selectVirtualEnvWithPython(resolve('path', 'to', 'venv'))

      await Promise.all([firstDisposal, correctTelemetryEventSent])

      expect(
        await workspace.getConfiguration().get(ConfigKey.PYTHON_PATH)
      ).to.equal(mockPath)

      expect(
        mockCanRunCli,
        'should have checked to see if the cli could be run with the given execution details'
      ).to.have.been.called
      expect(mockDataStatus, 'should have updated the repository data').to.have
        .been.called
      expect(mockExpShow, 'should have updated the experiments data').to.have
        .been.called

      expect(
        mockSendTelemetryEvent,
        'should send the correct event details'
      ).to.be.calledWithExactly(
        EventName.EXTENSION_EXECUTION_DETAILS_CHANGED,
        {
          cliAccessible: true,
          deps: 8,
          dvcPathUsed: false,
          dvcRootCount: 1,
          hasCheckpoints: 1,
          images: 3,
          metrics: 4,
          msPythonInstalled: true,
          msPythonUsed: false,
          noCheckpoints: 0,
          params: 9,
          pythonPathUsed: true,
          templates: 3,
          tracked: 13,
          workspaceFolderCount: 1
        },
        match.has('duration')
      )

      expect(
        mockDisposer,
        'should dispose of the current repositories and experiments before creating new ones'
      ).to.have.been.called

      await workspaceExperimentsAreReady
      const secondDisposal = disposalEvent()

      await selectVirtualEnvWithPython(resolve('path', 'to', 'virtualenv'))

      await secondDisposal

      expect(
        mockDisposer,
        'should dispose of the current repositories and experiments if the cli can no longer be found'
      ).to.have.been.called

      expect(mockCreateFileSystemWatcher).not.to.be.calledWithMatch('{}')
    }).timeout(25000)

    it('should send an error telemetry event when setupWorkspace fails', async () => {
      mockDuration(0)

      const mockErrorMessage = 'NOPE'
      stub(Setup, 'setupWorkspace').rejects(new Error(mockErrorMessage))
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      await expect(
        commands.executeCommand(RegisteredCommands.EXTENSION_SETUP_WORKSPACE)
      ).to.be.eventually.rejectedWith(Error)

      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        `errors.${RegisteredCommands.EXTENSION_SETUP_WORKSPACE}`,
        { error: mockErrorMessage },
        { duration: 0 }
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })

  describe('dvc.stopRunningExperiment', () => {
    it('should send a telemetry event containing properties relating to the event', async () => {
      const duration = 1234
      mockDuration(duration)

      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      await commands.executeCommand(RegisteredCommands.STOP_EXPERIMENT)

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
    })
  })

  describe('dvc.init', () => {
    it('should be able to run dvc.init without error', async () => {
      const mockInit = stub(DvcExecutor.prototype, 'init').resolves('')
      const mockSetup = stub(Setup, 'setup')
      const mockSetupCalled = new Promise(resolve =>
        mockSetup.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      )

      await commands.executeCommand(RegisteredCliCommands.INIT)
      await mockSetupCalled
      expect(mockInit).to.be.calledOnce
      expect(mockSetup).to.be.calledOnce

      mockInit.resetHistory()
      mockSetup.resetHistory()
      stub(WorkspaceFolders, 'getFirstWorkspaceFolder').returns(undefined)

      await commands.executeCommand(RegisteredCliCommands.INIT)

      expect(mockInit).not.to.be.called
      expect(mockSetup).not.to.be.called
    })
  })

  describe('dvc.showCommands', () => {
    it('should show all of the dvc commands without error', async () => {
      await expect(
        commands.executeCommand(RegisteredCommands.EXTENSION_SHOW_COMMANDS)
      ).to.be.eventually.equal(undefined)
    })
  })

  describe('dvc.showOutput', () => {
    it('should be able to show the output channel', async () => {
      const showOutputSpy = spy(OutputChannel.prototype, 'show')
      await commands.executeCommand(RegisteredCommands.EXTENSION_SHOW_OUTPUT)
      expect(showOutputSpy).to.have.been.calledOnce
    })
  })

  describe('dvc.checkCLICompatible', () => {
    it('should call setup', async () => {
      const mockSetup = stub(Setup, 'setup').resolves(undefined)
      await commands.executeCommand(
        RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE
      )
      expect(mockSetup).to.have.been.calledOnce
    })

    it('should set the dvc.cli.incompatible context value', async () => {
      stub(Watcher, 'createFileSystemWatcher').returns(undefined)
      stub(DvcReader.prototype, 'expShow').resolves({
        [EXPERIMENT_WORKSPACE_ID]: { baseline: {} }
      })
      stub(DvcReader.prototype, 'root').resolves('.')
      stub(DvcReader.prototype, 'dataStatus').resolves({})
      stub(DvcReader.prototype, 'plotsDiff').resolves({})
      stub(GitReader.prototype, 'hasChanges').resolves(false)
      stub(GitReader.prototype, 'listUntracked').resolves(new Set())
      stub(Config.prototype, 'getPythonBinPath').resolves(join('python'))

      const mockVersion = stub(DvcReader.prototype, 'version')
        .onFirstCall()
        .resolves('1.0.0')
        .onSecondCall()
        .resolves(MIN_CLI_VERSION)
        .onThirdCall()
        .rejects(new Error('NO CLI HERE'))

      const executeCommandSpy = spy(commands, 'executeCommand')
      await commands.executeCommand(
        RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE
      )

      expect(mockVersion).to.be.calledOnce
      expect(
        executeCommandSpy,
        'should set dvc.cli.incompatible to true if the version is incompatible'
      ).to.be.calledWithExactly('setContext', 'dvc.cli.incompatible', true)
      executeCommandSpy.resetHistory()

      await commands.executeCommand(
        RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE
      )

      expect(mockVersion).to.be.calledTwice
      expect(
        executeCommandSpy,
        'should set dvc.cli.incompatible to false if the version is compatible'
      ).to.be.calledWithExactly('setContext', 'dvc.cli.incompatible', false)

      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves(undefined)

      await commands.executeCommand(
        RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE
      )

      expect(
        executeCommandSpy,
        'should unset dvc.cli.incompatible if the CLI throws an error'
      ).to.be.calledWithExactly('setContext', 'dvc.cli.incompatible', undefined)
      expect(
        mockShowWarningMessage,
        'should warn the user if the CLI throws an error'
      ).to.be.calledOnce
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
