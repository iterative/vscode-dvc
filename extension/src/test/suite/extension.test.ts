import { join, resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { stub, restore, spy, match } from 'sinon'
import { window, commands, workspace, Uri } from 'vscode'
import { ensureFileSync } from 'fs-extra'
import {
  closeAllEditors,
  configurationChangeEvent,
  mockDuration,
  quickPickInitialized,
  selectQuickPickItem
} from './util'
import { mockHasCheckpoints } from './experiments/util'
import { WEBVIEW_TEST_TIMEOUT } from './timeouts'
import { Disposable } from '../../extension'
import * as Python from '../../extensions/python'
import { CliReader, ListOutput, StatusOutput } from '../../cli/reader'
import expShowFixture from '../fixtures/expShow/output'
import plotsDiffFixture from '../fixtures/plotsDiff/output'
import * as Disposer from '../../util/disposable'
import { RegisteredCommands } from '../../commands/external'
import * as Setup from '../../setup'
import * as Telemetry from '../../telemetry'
import { EventName } from '../../telemetry/constants'
import { OutputChannel } from '../../vscode/outputChannel'
import { WorkspaceExperiments } from '../../experiments/workspace'
import { QuickPickItemWithValue } from '../../vscode/quickPick'
import { MIN_CLI_VERSION } from '../../cli/constants'
import { dvcDemoPath } from '../util'
import { fireWatcher } from '../../fileSystem/watcher'
import { exists } from '../../fileSystem'
import { getVenvBinPath } from '../../python'

suite('Extension Test Suite', () => {
  const dvcPathOption = 'dvc.dvcPath'
  const pythonPathOption = 'dvc.pythonPath'

  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(5000)
    disposable.dispose()
    return Promise.all([
      workspace.getConfiguration().update(dvcPathOption, undefined, false),
      workspace.getConfiguration().update(pythonPathOption, undefined, false),
      closeAllEditors()
    ])
  })

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('dvc.setupWorkspace', () => {
    it('should set dvc.dvcPath to the default when dvc is installed in a virtual environment', async () => {
      stub(Python, 'isPythonExtensionInstalled').returns(true)
      stub(CliReader.prototype, 'version').rejects('do not run setup')

      const mockShowQuickPick = stub(window, 'showQuickPick')

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set dvc.pythonPath to the picked value when the user selects to pick a Python interpreter', async () => {
      stub(CliReader.prototype, 'version').rejects('still do not run setup')
      stub(Python, 'isPythonExtensionInstalled').returns(true)

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

      const selectVenvAndInterpreter = selectQuickPickItem(2)
      await selectVenvAndInterpreter

      await pickOneOrInputActive
      mockCreateQuickPick.restore()

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
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should initialize the extension when the cli is usable', async () => {
      stub(Python, 'isPythonExtensionInstalled').returns(true)
      const selectDvcPathFromFilePicker = async () => {
        const quickPick =
          window.createQuickPick<QuickPickItemWithValue<string>>()

        const mockShowQuickPick = stub(window, 'showQuickPick')

        const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)
        const globalQuickPickActive = quickPickInitialized(mockShowQuickPick, 1)

        const mockCreateQuickPick = stub(window, 'createQuickPick').returns(
          quickPick
        )
        const pickOneOrInputActive = new Promise(resolve => {
          disposable.track(
            quickPick.onDidChangeActive(() => resolve(undefined))
          )
        })

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

        await pickOneOrInputActive
        mockCreateQuickPick.restore()

        const dvcPathChanged = configurationChangeEvent(
          dvcPathOption,
          disposable
        )

        const selectToFindCLI = selectQuickPickItem(1)
        await selectToFindCLI

        await dvcPathChanged

        return setupWorkspaceWizard
      }

      const createFileSystemWatcherSpy = spy(
        workspace,
        'createFileSystemWatcher'
      )

      const mockCanRunCli = stub(CliReader.prototype, 'version')
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

      const mockUri = Uri.file(resolve('file', 'picked', 'path', 'to', 'dvc'))
      const mockPath = mockUri.fsPath

      const mockShowOpenDialog = stub(window, 'showOpenDialog')
        .onFirstCall()
        .resolves([mockUri])
        .onSecondCall()
        .resolves([Uri.file(resolve('path', 'to', 'dvc'))])

      mockHasCheckpoints(expShowFixture)
      const mockExpShow = stub(CliReader.prototype, 'expShow').resolves(
        expShowFixture
      )

      const mockList = stub(
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

      stub(CliReader.prototype, 'root').resolves('.')

      const mockDiff = stub(CliReader.prototype, 'diff').resolves({
        modified: [
          { path: 'model.pt' },
          { path: 'logs' },
          { path: 'data/MNIST/raw' }
        ]
      })

      stub(CliReader.prototype, 'plotsDiff').resolves(plotsDiffFixture)

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

      const mockWorkspaceExperimentsReady = stub(
        WorkspaceExperiments.prototype,
        'isReady'
      )

      const workspaceExperimentsAreReady = new Promise(resolve =>
        mockWorkspaceExperimentsReady.callsFake(async () => {
          await mockWorkspaceExperimentsReady.wrappedMethod()
          resolve(undefined)
        })
      )

      await selectDvcPathFromFilePicker()

      expect(await workspace.getConfiguration().get(dvcPathOption)).to.equal(
        mockPath
      )

      await Promise.all([firstDisposal, correctTelemetryEventSent])

      expect(mockShowOpenDialog, 'should show the open dialog').to.have.been
        .called
      expect(
        mockCanRunCli,
        'should have checked to see if the cli could be run with the given execution details'
      ).to.have.been.called
      expect(mockList, 'should have updated the repository data').to.have.been
        .called
      expect(mockDiff).to.have.been.called
      expect(mockStatus).to.have.been.called
      expect(mockExpShow, 'should have updated the experiments data').to.have
        .been.called

      expect(
        mockSendTelemetryEvent,
        'should send the correct event details'
      ).to.be.calledWithExactly(
        EventName.EXTENSION_EXECUTION_DETAILS_CHANGED,
        {
          cliAccessible: true,
          dvcPathUsed: true,
          dvcRootCount: 1,
          hasCheckpoints: 1,
          images: 3,
          metrics: 4,
          msPythonInstalled: true,
          msPythonUsed: false,
          noCheckpoints: 0,
          params: 8,
          pythonPathUsed: false,
          templates: 3,
          tracked: 15,
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

      await selectDvcPathFromFilePicker()

      await secondDisposal

      expect(
        mockDisposer,
        'should dispose of the current repositories and experiments if the cli can no longer be found'
      ).to.have.been.called

      expect(createFileSystemWatcherSpy).not.to.be.calledWithMatch('{}')
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

    it('should call setup if the cli is inaccessible and a virtual environment is updated with DVC', async () => {
      const updateEvent = new Promise(resolve =>
        workspace.onDidChangeConfiguration(e => {
          if (e.affectsConfiguration(dvcPathOption)) {
            resolve(undefined)
          }
        })
      )

      workspace
        .getConfiguration()
        .update(dvcPathOption, join('not', 'a', 'valid', 'dvc', 'path'), false)

      await updateEvent

      const mockSetup = stub(Setup, 'setup')
      const setupEvent = new Promise(resolve =>
        mockSetup.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      )

      const dvcPath = getVenvBinPath(dvcDemoPath, '.env', 'dvc')
      exists(dvcPath) ? fireWatcher(dvcPath) : ensureFileSync(dvcPath)

      await setupEvent

      expect(mockSetup).to.be.calledOnce
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
      stub(CliReader.prototype, 'expShow').resolves({
        workspace: { baseline: {} }
      })
      stub(CliReader.prototype, 'listDvcOnlyRecursive').resolves([])
      stub(CliReader.prototype, 'root').resolves('.')
      stub(CliReader.prototype, 'diff').resolves({})
      stub(CliReader.prototype, 'plotsDiff').resolves({})
      stub(CliReader.prototype, 'status').resolves({})

      const mockVersion = stub(CliReader.prototype, 'version')
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

      expect(mockVersion).to.be.calledThrice
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
