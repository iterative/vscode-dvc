import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { ensureFileSync, remove } from 'fs-extra'
import { expect } from 'chai'
import { SinonStub, restore, spy, stub } from 'sinon'
import { QuickPickItem, Uri, commands, window, workspace } from 'vscode'
import { buildSetup, buildSetupWithWatchers, TEMP_DIR } from './util'
import {
  closeAllEditors,
  getMessageReceivedEmitter,
  quickPickInitialized,
  selectQuickPickItem
} from '../util'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { MessageFromWebviewType } from '../../../webview/contract'
import { Disposable } from '../../../extension'
import { Logger } from '../../../common/logger'
import { BaseWebview } from '../../../webview'
import {
  RegisteredCliCommands,
  RegisteredCommands
} from '../../../commands/external'
import { isDirectory } from '../../../fileSystem'
import { gitPath } from '../../../cli/git/constants'
import { join } from '../../util/path'
import { DOT_DVC } from '../../../cli/dvc/constants'
import * as Config from '../../../vscode/config'
import { dvcDemoPath } from '../../util'
import {
  QuickPickItemWithValue,
  QuickPickOptionsWithTitle
} from '../../../vscode/quickPick'
import * as Telemetry from '../../../telemetry'
import { StopWatch } from '../../../util/time'
import { MIN_CLI_VERSION } from '../../../cli/dvc/contract'
import { run } from '../../../setup/runner'
import * as Python from '../../../extensions/python'

suite('Setup Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    disposable.dispose()
    if (isDirectory(TEMP_DIR)) {
      void remove(TEMP_DIR)
    }
    return Promise.all([
      workspace
        .getConfiguration()
        .update(Config.ConfigKey.PYTHON_PATH, undefined, false),
      closeAllEditors()
    ])
  })

  describe('Setup', () => {
    it('should handle an initialize git message from the webview', async () => {
      const { messageSpy, setup, mockInitializeGit } = buildSetup(disposable)

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.INITIALIZE_GIT
      })

      expect(mockInitializeGit).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle an initialize project message from the webview', async () => {
      const { messageSpy, setup } = buildSetup(disposable)

      const mockExecuteCommand = stub(commands, 'executeCommand').resolves(
        undefined
      )

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.INITIALIZE_DVC
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(
        RegisteredCliCommands.INIT
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a check cli compatible message from the webview', async () => {
      const { messageSpy, setup } = buildSetup(disposable)

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockExecuteCommand = stub(commands, 'executeCommand').resolves(true)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.CHECK_CLI_COMPATIBLE
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(
        RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle an auto install dvc message from the webview', async () => {
      const { messageSpy, setup, mockAutoInstallDvc } = buildSetup(disposable)

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.INSTALL_DVC
      })

      expect(mockAutoInstallDvc).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a select Python interpreter message from the webview', async () => {
      const { messageSpy, setup } = buildSetup(disposable)
      const setInterpreterCommand = 'python.setInterpreter'

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockExecuteCommand = stub(commands, 'executeCommand').resolves(
        undefined
      )

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(setInterpreterCommand)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a show source control panel message from the webview', async () => {
      const { messageSpy, setup } = buildSetup(disposable)
      const showScmPanelCommand = 'workbench.view.scm'

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockExecuteCommand = stub(commands, 'executeCommand').resolves(
        undefined
      )

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SHOW_SCM_PANEL
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(showScmPanelCommand)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a setup the workspace message from the webview', async () => {
      const { messageSpy, setup } = buildSetup(disposable)

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockExecuteCommand = stub(commands, 'executeCommand').resolves(true)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SETUP_WORKSPACE
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should log an error message if the message from the webview is unexpected', async () => {
      const { messageSpy, setup } = buildSetup(disposable)

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const loggerSpy = spy(Logger, 'error')

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.ADD_STARRED_EXPERIMENT_FILTER
      })

      expect(loggerSpy).to.be.calledOnce
      expect(loggerSpy).to.be.calledWithExactly(
        `Unexpected message: {"type":"${MessageFromWebviewType.ADD_STARRED_EXPERIMENT_FILTER}"}`
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should close the webview and open the experiments when the setup is done', async () => {
      const { setup, mockOpenExperiments } = buildSetup(disposable, true)

      const closeWebviewSpy = spy(BaseWebview.prototype, 'dispose')

      const webview = await setup.showWebview()
      await webview.isReady()

      stub(setup, 'hasRoots').returns(true)
      setup.setCliCompatible(true)
      setup.setAvailable(true)

      expect(closeWebviewSpy).to.be.calledOnce
      expect(mockOpenExperiments).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the expected message to the webview when there is no CLI available', async () => {
      const { config, setup, messageSpy } = buildSetup(disposable)

      await config.isReady()

      setup.setCliCompatible(undefined)
      setup.setAvailable(false)
      await setup.setRoots()

      messageSpy.restore()
      const mockSendMessage = stub(BaseWebview.prototype, 'show')

      const messageSent = new Promise(resolve =>
        mockSendMessage.callsFake(data => {
          resolve(undefined)
          return Promise.resolve(!!data)
        })
      )

      const webview = await setup.showWebview()
      await webview.isReady()

      await messageSent

      expect(mockSendMessage).to.be.calledOnce
      expect(mockSendMessage).to.be.calledWithExactly({
        canGitInitialize: true,
        cliCompatible: undefined,
        hasData: false,
        isPythonExtensionInstalled: false,
        needsGitCommit: true,
        needsGitInitialized: true,
        projectInitialized: false,
        pythonBinPath: undefined
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the expected message to the webview when there is no Git repository in the workspace', async () => {
      const { config, setup, messageSpy } = buildSetup(disposable)

      await config.isReady()

      setup.setCliCompatible(true)
      setup.setAvailable(true)
      await setup.setRoots()

      messageSpy.restore()
      const mockSendMessage = stub(BaseWebview.prototype, 'show')

      const messageSent = new Promise(resolve =>
        mockSendMessage.callsFake(data => {
          resolve(undefined)
          return Promise.resolve(!!data)
        })
      )

      const webview = await setup.showWebview()
      await webview.isReady()

      await messageSent

      expect(mockSendMessage).to.be.calledOnce
      expect(mockSendMessage).to.be.calledWithExactly({
        canGitInitialize: true,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        needsGitCommit: true,
        needsGitInitialized: true,
        projectInitialized: false,
        pythonBinPath: undefined
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the expected message to the webview when there is no DVC project in the workspace', async () => {
      const { config, setup, messageSpy } = buildSetup(
        disposable,
        false,
        true,
        false,
        false
      )

      await config.isReady()

      setup.setCliCompatible(true)
      setup.setAvailable(true)
      await setup.setRoots()

      messageSpy.restore()
      const mockSendMessage = stub(BaseWebview.prototype, 'show')

      const messageSent = new Promise(resolve =>
        mockSendMessage.callsFake(data => {
          resolve(undefined)
          return Promise.resolve(!!data)
        })
      )

      const webview = await setup.showWebview()
      await webview.isReady()

      await messageSent

      expect(mockSendMessage).to.be.calledOnce
      expect(mockSendMessage).to.be.calledWithExactly({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        needsGitCommit: false,
        needsGitInitialized: false,
        projectInitialized: false,
        pythonBinPath: undefined
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the expected message to the webview when there is no commits in the git repository', async () => {
      const { config, setup, messageSpy } = buildSetup(
        disposable,
        false,
        false,
        false,
        true
      )

      await config.isReady()

      setup.setCliCompatible(true)
      setup.setAvailable(true)
      await setup.setRoots()

      messageSpy.restore()
      const mockSendMessage = stub(BaseWebview.prototype, 'show')

      const messageSent = new Promise(resolve =>
        mockSendMessage.callsFake(data => {
          resolve(undefined)
          return Promise.resolve(!!data)
        })
      )

      const webview = await setup.showWebview()
      await webview.isReady()

      await messageSent

      expect(mockSendMessage).to.be.calledOnce
      expect(mockSendMessage).to.be.calledWithExactly({
        canGitInitialize: false,
        cliCompatible: true,
        hasData: false,
        isPythonExtensionInstalled: false,
        needsGitCommit: true,
        needsGitInitialized: false,
        projectInitialized: true,
        pythonBinPath: undefined
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should setup the appropriate watchers', async () => {
      const { setup, mockRunSetup, onDidChangeWorkspace } =
        await buildSetupWithWatchers(disposable)

      let workspaceChangedCount = 0
      disposable.track(
        onDidChangeWorkspace(() => {
          workspaceChangedCount = workspaceChangedCount + 1
        })
      )

      const resetMockRunSetup = () => {
        mockRunSetup.resetHistory()
        mockRunSetup.resetBehavior()
        return new Promise(resolve =>
          mockRunSetup.callsFake(() => {
            resolve(undefined)
            return Promise.resolve([])
          })
        )
      }

      const setupCalledOnGitInit = resetMockRunSetup()

      ensureFileSync(join(TEMP_DIR, gitPath.DOT_GIT))

      await setupCalledOnGitInit

      expect(mockRunSetup, 'should called setup when Git is initialized').to.be
        .called
      expect(workspaceChangedCount).to.equal(1)

      const setupCalledOnDvcInit = resetMockRunSetup()

      ensureFileSync(join(TEMP_DIR, DOT_DVC))

      await setupCalledOnDvcInit

      expect(mockRunSetup, 'should called setup when DVC is initialized').to.be
        .called
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((setup as any).dotFolderWatcher.disposed).to.be.true
      expect(workspaceChangedCount).to.equal(2)

      const setupCalledOnDvcInstalled = resetMockRunSetup()

      ensureFileSync(join(TEMP_DIR, 'dvc'))

      await setupCalledOnDvcInstalled

      expect(
        mockRunSetup,
        'should called setup when DVC is installed into a virtual environment'
      ).to.be.called
      expect(workspaceChangedCount).to.equal(3)
    })

    it('should be able to select focused projects', async () => {
      const mockFocusedProjects = [dvcDemoPath]
      ;(
        stub(window, 'showQuickPick') as SinonStub<
          [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
          Thenable<QuickPickItemWithValue<string>[] | undefined>
        >
      ).resolves([
        { label: dvcDemoPath, value: dvcDemoPath }
      ] as QuickPickItemWithValue[])
      const mockSetConfigValue = stub(Config, 'setConfigValue').resolves(
        undefined
      )
      await commands.executeCommand(RegisteredCommands.SELECT_FOCUSED_PROJECTS)
      expect(mockSetConfigValue).to.be.calledOnce
      expect(mockSetConfigValue).to.be.calledWithExactly(
        Config.ConfigKey.FOCUSED_PROJECTS,
        mockFocusedProjects
      )
    })

    it("should prompt show the Python extension's select python interpreter command if the extension is installed and the user chooses to use a virtual environment", async () => {
      stub(Python, 'isPythonExtensionInstalled').returns(true)
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
          resolve(undefined)
        })
      )

      await venvQuickPickActive

      await Promise.all([
        selectQuickPickItem(1),
        executeCommandCalled,
        setupWorkspaceWizard
      ])

      expect(mockSelectPythonInterpreter).to.be.calledOnce
    })

    it('should set dvc.pythonPath to the picked value when the user selects to pick a Python interpreter', async () => {
      const { config, setup, mockVersion } = buildSetup(disposable)

      stub(config, 'isPythonExtensionInstalled').returns(false)

      mockVersion.rejects('do not initialize')

      const mockShowQuickPick = stub(window, 'showQuickPick')
      const mockUri = Uri.file(
        resolve('file', 'picked', 'path', 'to', 'python')
      )
      const mockPath = mockUri.fsPath
      stub(window, 'showOpenDialog').resolves([mockUri])

      const venvQuickPickActive = quickPickInitialized(mockShowQuickPick, 0)

      const quickPick = window.createQuickPick<QuickPickItemWithValue<string>>()
      const mockCreateQuickPick = stub(window, 'createQuickPick').returns(
        quickPick
      )
      const pickOneOrInputActive = new Promise(resolve => {
        disposable.track(quickPick.onDidChangeActive(() => resolve(undefined)))
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setupWorkspaceWizard = (setup as any).setupWorkspace()

      await venvQuickPickActive

      const selectVenvAndInterpreter = selectQuickPickItem(1)

      await selectVenvAndInterpreter

      await pickOneOrInputActive

      mockCreateQuickPick.restore()

      const selectToFindInterpreter = selectQuickPickItem(1)
      await selectToFindInterpreter

      await setupWorkspaceWizard

      expect(config.getPythonBinPath()).to.equal(mockPath)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send an error telemetry event when setupWorkspace fails', async () => {
      stub(StopWatch.prototype, 'getElapsedTime').returns(0)

      const { setup } = buildSetup(disposable)

      const mockErrorMessage = 'NOPE'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(setup as any, 'runWorkspace').rejects(new Error(mockErrorMessage))
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (setup as any).setupWorkspace()
      ).to.be.eventually.rejectedWith(Error)

      expect(mockSendTelemetryEvent).to.be.calledWithExactly(
        `errors.${RegisteredCommands.EXTENSION_SETUP_WORKSPACE}`,
        { error: mockErrorMessage },
        { duration: 0 }
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should set the dvc.cli.incompatible context value', async () => {
      const { config, mockRunSetup, mockVersion, setup } = buildSetup(
        disposable,
        true,
        false,
        false
      )
      mockRunSetup.restore()
      stub(config, 'isPythonExtensionUsed').returns(false)
      stub(config, 'getPythonBinPath').resolves(join('python'))

      mockVersion.resetBehavior()
      mockVersion
        .onFirstCall()
        .resolves('1.0.0')
        .onSecondCall()
        .resolves(MIN_CLI_VERSION)
        .onThirdCall()
        .rejects(new Error('NO CLI HERE'))

      const executeCommandSpy = spy(commands, 'executeCommand')
      await run(setup)

      expect(mockVersion).to.be.calledOnce
      expect(
        executeCommandSpy,
        'should set dvc.cli.incompatible to true if the version is incompatible'
      ).to.be.calledWithExactly('setContext', 'dvc.cli.incompatible', true)
      executeCommandSpy.resetHistory()

      await run(setup)

      expect(mockVersion).to.be.calledTwice
      expect(
        executeCommandSpy,
        'should set dvc.cli.incompatible to false if the version is compatible'
      ).to.be.calledWithExactly('setContext', 'dvc.cli.incompatible', false)

      const mockShowWarningMessage = stub(
        window,
        'showWarningMessage'
      ).resolves(undefined)

      await run(setup)

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
})
