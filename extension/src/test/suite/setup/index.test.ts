import { resolve } from 'path'
import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { ensureFileSync, remove } from 'fs-extra'
import { expect } from 'chai'
import { SinonStub, restore, spy, stub } from 'sinon'
import * as Fetch from 'node-fetch'
import {
  MessageItem,
  QuickPickItem,
  Uri,
  commands,
  window,
  workspace
} from 'vscode'
import { buildSetup, buildSetupWithWatchers, TEMP_DIR } from './util'
import {
  closeAllEditors,
  getMessageReceivedEmitter,
  quickPickInitialized,
  selectQuickPickItem,
  waitForSpyCall
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
import { ConfigKey, DOT_DVC, Flag } from '../../../cli/dvc/constants'
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
import { ContextKey } from '../../../vscode/context'
import * as ExternalUtil from '../../../vscode/external'
import { Setup } from '../../../setup'
import { STUDIO_URL, SetupSection } from '../../../setup/webview/contract'
import { getFirstWorkspaceFolder } from '../../../vscode/workspaceFolders'
import { Response } from '../../../vscode/response'
import { DvcConfig } from '../../../cli/dvc/config'
import * as QuickPickUtil from '../../../setup/quickPick'
import { EventName } from '../../../telemetry/constants'
import { Modal } from '../../../vscode/modal'
import { Toast } from '../../../vscode/toast'

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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe('Setup', () => {
    it('should handle an initialize git message from the webview', async () => {
      const { messageSpy, setup, mockInitializeGit } = buildSetup({
        disposer: disposable
      })

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
      const { messageSpy, mockExecuteCommand, setup } = buildSetup({
        disposer: disposable
      })

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
      const { messageSpy, mockExecuteCommand, setup } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.CHECK_CLI_COMPATIBLE
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(
        RegisteredCommands.EXTENSION_CHECK_CLI_COMPATIBLE
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle an auto install dvc message from the webview', async () => {
      const { messageSpy, setup, mockAutoInstallDvc } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockIsPythonExtensionUsed = stub(setup, 'isPythonExtensionUsed')
      const isExtensionUsedEvent = new Promise(resolve => {
        mockIsPythonExtensionUsed.onFirstCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(false)
        })
      })

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.INSTALL_DVC
      })

      await isExtensionUsedEvent

      expect(mockAutoInstallDvc).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle an auto upgrade dvc message from the webview', async () => {
      const { messageSpy, setup, mockAutoUpgradeDvc } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockIsPythonExtensionUsed = stub(setup, 'isPythonExtensionUsed')
      const isExtensionUsedEvent = new Promise(resolve => {
        mockIsPythonExtensionUsed.onFirstCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(false)
        })
      })

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.UPGRADE_DVC
      })

      await isExtensionUsedEvent

      expect(mockAutoUpgradeDvc).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle an update Python environment message from the webview', async () => {
      const { messageSpy, setup, mockExecuteCommand } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockPickExtensionAction = stub(
        QuickPickUtil,
        'pickPythonExtensionAction'
      )

      const firstQuickPickEvent = new Promise(resolve => {
        mockPickExtensionAction.onFirstCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      })

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.UPDATE_PYTHON_ENVIRONMENT
      })

      await firstQuickPickEvent

      expect(mockExecuteCommand).to.not.be.calledWithExactly(
        'python.setInterpreter'
      )
      expect(mockExecuteCommand).to.not.be.calledWithExactly(
        'python.createEnvironment'
      )

      const secondQuickPickEvent = new Promise(resolve => {
        mockPickExtensionAction.onSecondCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(
            QuickPickUtil.PYTHON_EXTENSION_ACTION.CREATE_ENV
          )
        })
      })

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.UPDATE_PYTHON_ENVIRONMENT
      })

      await secondQuickPickEvent

      expect(mockExecuteCommand).to.be.calledWithExactly(
        'python.createEnvironment'
      )

      const thirdQuickPickEvent = new Promise(resolve => {
        mockPickExtensionAction.onThirdCall().callsFake(() => {
          resolve(undefined)
          return Promise.resolve(
            QuickPickUtil.PYTHON_EXTENSION_ACTION.SET_INTERPRETER
          )
        })
      })

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.UPDATE_PYTHON_ENVIRONMENT
      })

      await thirdQuickPickEvent

      expect(mockExecuteCommand).to.be.calledWithExactly(
        'python.setInterpreter'
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a show source control panel message from the webview', async () => {
      const { messageSpy, mockExecuteCommand, setup } = buildSetup({
        disposer: disposable
      })
      const showScmPanelCommand = 'workbench.view.scm'

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SHOW_SCM_PANEL
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(showScmPanelCommand)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a show walkthrough message from the webview', async () => {
      const { messageSpy, mockExecuteCommand, setup } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SHOW_WALKTHROUGH
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(
        RegisteredCommands.EXTENSION_GET_STARTED
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a setup the workspace message from the webview', async () => {
      const { messageSpy, mockExecuteCommand, setup } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SETUP_WORKSPACE
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(
        RegisteredCommands.EXTENSION_SETUP_WORKSPACE
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should log an error message if the message from the webview is unexpected', async () => {
      const { messageSpy, setup } = buildSetup({ disposer: disposable })

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

    it('should send the expected message to the webview when there is no CLI available', async () => {
      const { config, setup, messageSpy } = buildSetup({ disposer: disposable })

      await config.isReady()

      setup.setCliCompatibleAndVersion(undefined, undefined)
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
        dvcCliDetails: { command: 'dvc', version: undefined },
        hasData: false,
        isAboveLatestTestedVersion: undefined,
        isPythonEnvironmentGlobal: false,
        isPythonExtensionInstalled: false,
        isPythonExtensionUsed: false,
        isStudioConnected: false,
        needsGitCommit: true,
        needsGitInitialized: true,
        projectInitialized: false,
        pythonBinPath: undefined,
        remoteList: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: false
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the expected message to the webview when there is no Git repository in the workspace', async () => {
      const { config, setup, messageSpy } = buildSetup({ disposer: disposable })

      await config.isReady()

      setup.setCliCompatibleAndVersion(true, MIN_CLI_VERSION)
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
        dvcCliDetails: { command: 'dvc', version: MIN_CLI_VERSION },
        hasData: false,
        isAboveLatestTestedVersion: false,
        isPythonEnvironmentGlobal: false,
        isPythonExtensionInstalled: false,
        isPythonExtensionUsed: false,
        isStudioConnected: false,
        needsGitCommit: true,
        needsGitInitialized: true,
        projectInitialized: false,
        pythonBinPath: undefined,
        remoteList: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: true
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the expected message to the webview when there is no DVC project in the workspace', async () => {
      const { config, setup, messageSpy } = buildSetup({
        disposer: disposable,
        hasData: false,
        noDvcRoot: true,
        noGitCommits: false,
        noGitRoot: false
      })

      await config.isReady()

      setup.setCliCompatibleAndVersion(true, MIN_CLI_VERSION)
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
        dvcCliDetails: {
          command: 'dvc',
          version: MIN_CLI_VERSION
        },
        hasData: false,
        isAboveLatestTestedVersion: false,
        isPythonEnvironmentGlobal: false,
        isPythonExtensionInstalled: false,
        isPythonExtensionUsed: false,
        isStudioConnected: false,
        needsGitCommit: false,
        needsGitInitialized: false,
        projectInitialized: false,
        pythonBinPath: undefined,
        remoteList: undefined,
        sectionCollapsed: undefined,
        shareLiveToStudio: true
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the expected message to the webview when there is no commits in the git repository', async () => {
      const { config, setup, messageSpy } = buildSetup({
        disposer: disposable,
        hasData: false,
        noDvcRoot: false,
        noGitCommits: true,
        noGitRoot: false
      })

      await config.isReady()

      setup.setCliCompatibleAndVersion(true, MIN_CLI_VERSION)
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
        dvcCliDetails: {
          command: 'dvc',
          version: MIN_CLI_VERSION
        },
        hasData: false,
        isAboveLatestTestedVersion: false,
        isPythonEnvironmentGlobal: false,
        isPythonExtensionInstalled: false,
        isPythonExtensionUsed: false,
        isStudioConnected: false,
        needsGitCommit: true,
        needsGitInitialized: false,
        projectInitialized: true,
        pythonBinPath: undefined,
        remoteList: { [dvcDemoPath]: undefined },
        sectionCollapsed: undefined,
        shareLiveToStudio: true
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the expected message to the webview when git cannot be found', async () => {
      const { config, setup, mockGitVersion, messageSpy } = buildSetup({
        disposer: disposable,
        gitVersion: null
      })

      await config.isReady()

      setup.setCliCompatibleAndVersion(false, undefined)
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

      expect(mockGitVersion).to.be.called
      expect(mockSendMessage).to.be.calledOnce
      expect(mockSendMessage).to.be.calledWithMatch({
        canGitInitialize: false,
        needsGitCommit: true,
        needsGitInitialized: true,
        projectInitialized: false
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
    }).timeout(10000)

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
      const { config, mockVersion, mockExecuteCommand, setup } = buildSetup({
        disposer: disposable
      })

      mockExecuteCommand.restore()
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

      const { setup } = buildSetup({ disposer: disposable })

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
      const { config, mockExecuteCommand, mockRunSetup, mockVersion, setup } =
        buildSetup({
          disposer: disposable,
          hasData: true,
          noDvcRoot: false,
          noGitRoot: false
        })

      mockExecuteCommand.restore()
      mockRunSetup.restore()
      stub(config, 'isPythonExtensionUsed').returns(false)
      stub(config, 'getPythonBinPath').returns(join('python'))

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

    it('should call the CLI to see if there is a global version of DVC available if the Python version fails', async () => {
      const {
        config,
        mockExecuteCommand,
        mockGlobalVersion,
        mockRunSetup,
        mockVersion,
        setup
      } = buildSetup({
        disposer: disposable,
        hasData: true,
        noDvcRoot: false,
        noGitRoot: false
      })

      mockExecuteCommand.restore()
      mockRunSetup.restore()
      stub(config, 'isPythonExtensionUsed').returns(true)

      mockVersion.resetBehavior()
      mockVersion.rejects(new Error('no CLI here'))

      const executeCommandSpy = spy(commands, 'executeCommand')
      await run(setup)

      expect(mockVersion).to.be.calledOnce
      expect(mockGlobalVersion).to.be.calledOnce
      expect(
        executeCommandSpy,
        'should set dvc.cli.incompatible to false if the version is compatible'
      ).to.be.calledWithExactly('setContext', 'dvc.cli.incompatible', false)
    })

    it('should handle a message from the webview to request a token from studio', async () => {
      const { setup, mockFetch, studio } = buildSetup({
        disposer: disposable
      })

      const mockConfig = stub(DvcConfig.prototype, 'config')
      mockConfig.resolves('')
      const webview = await setup.showWebview()
      await webview.isReady()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(Setup.prototype as any, 'getCliCompatible').returns(true)

      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockSendTelemetryEvent = stub(Telemetry, 'sendTelemetryEvent')
      const mockGetCallbackUrl = stub(ExternalUtil, 'getCallBackUrl')
      const mockOpenUrl = stub(ExternalUtil, 'openUrl')
      const mockWaitForUriRes = stub(ExternalUtil, 'waitForUriResponse')
      const mockUriHandlerDispose = stub()
      const mockStudioRes = {
        device_code: 'Yi-NPd9ggvNUDBcam5bP8iivbtLhnqVgM_lSSbilqNw',
        token_uri: 'https://studio.iterative.ai/api/device-login/token',
        user_code: '40DWMKNA',
        verification_uri: 'https://studio.iterative.ai/auth/device-login'
      }
      const mockCallbackUrl = 'url-to-vscode'

      mockFetch.onFirstCall().resolves({
        json: () => Promise.resolve(mockStudioRes)
      } as Fetch.Response)
      mockGetCallbackUrl.onFirstCall().resolves(mockCallbackUrl)

      const callbackUriHandlerEvent: Promise<() => unknown> = new Promise(
        resolve =>
          mockWaitForUriRes.onFirstCall().callsFake((_, onResponse) => {
            resolve(onResponse)
            return { dispose: mockUriHandlerDispose }
          })
      )

      mockMessageReceived.fire({
        type: MessageFromWebviewType.REQUEST_STUDIO_TOKEN
      })

      const mockOnStudioResponse = await callbackUriHandlerEvent

      expect(mockSendTelemetryEvent).to.be.calledOnce
      expect(mockSendTelemetryEvent).to.be.calledWith(
        EventName.VIEWS_SETUP_REQUEST_STUDIO_TOKEN,
        undefined,
        undefined
      )
      expect(mockFetch).to.be.calledOnce
      expect(mockFetch).to.be.calledOnceWithExactly(
        `${STUDIO_URL}/api/device-login`,
        {
          body: JSON.stringify({
            client_name: 'VS Code'
          }),
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST'
        }
      )
      expect(mockGetCallbackUrl).to.be.calledOnce
      expect(mockGetCallbackUrl).to.be.calledWith('/studio-complete-auth')
      expect(mockOpenUrl).to.be.calledOnce
      expect(mockOpenUrl).to.be.calledWith(
        `${mockStudioRes.verification_uri}?redirect_uri=${mockCallbackUrl}&code=${mockStudioRes.user_code}`
      )

      const mockModalShowError = stub(Modal, 'errorWithOptions')
      const mockSaveStudioToken = stub(studio, 'saveStudioAccessTokenInConfig')
      const showProgressSpy = spy(Toast, 'showProgress')
      const reportProgressErrorSpy = spy(Toast, 'reportProgressError')
      const delayProgressClosingSpy = spy(Toast, 'delayProgressClosing')
      mockFetch.onSecondCall().resolves({
        json: () =>
          Promise.resolve({ detail: 'Request failed for some reason.' }),
        status: 500
      } as Fetch.Response)

      const failedTokenEvent = waitForSpyCall(delayProgressClosingSpy, 0)

      mockOnStudioResponse()

      await failedTokenEvent

      expect(mockUriHandlerDispose).to.be.calledOnce
      expect(mockFetch).to.be.calledTwice
      expect(mockFetch).to.be.calledWithExactly(mockStudioRes.token_uri, {
        body: JSON.stringify({
          code: mockStudioRes.device_code
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      })
      expect(mockModalShowError).to.be.calledOnce
      expect(mockModalShowError).to.be.calledWithExactly(
        'Unable to get token. Failed with "Request failed for some reason."'
      )
      expect(showProgressSpy).to.be.calledOnce
      expect(reportProgressErrorSpy).to.be.calledOnce
      expect(mockSaveStudioToken).not.to.be.called

      const mockToken = 'isat_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      mockFetch.onThirdCall().resolves({
        json: () => Promise.resolve({ access_token: mockToken }),
        status: 200
      } as Fetch.Response)
      const tokenEvent = waitForSpyCall(delayProgressClosingSpy, 1)

      mockOnStudioResponse()

      await tokenEvent

      expect(mockFetch).to.be.calledThrice
      expect(mockSaveStudioToken).to.be.calledOnce
      expect(mockSaveStudioToken).to.be.calledWithExactly(
        dvcDemoPath,
        mockToken
      )
      expect(showProgressSpy).to.be.calledTwice
      expect(reportProgressErrorSpy).not.to.be.calledTwice
      expect(delayProgressClosingSpy).to.be.calledTwice
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should handle a message from the webview to manually save the user's Studio access token", async () => {
      const mockToken = 'isat_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

      const { setup, mockExecuteCommand, messageSpy } = buildSetup({
        disposer: disposable
      })
      mockExecuteCommand.restore()

      const mockConfig = stub(DvcConfig.prototype, 'config')
      mockConfig.resolves('')

      const executeCommandSpy = spy(commands, 'executeCommand')
      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      mockConfig.resetBehavior()
      mockConfig.resolves(mockToken)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(Setup.prototype as any, 'getCliCompatible').returns(true)

      const mockInputBox = stub(window, 'showInputBox').resolves(mockToken)

      messageSpy.restore()
      executeCommandSpy.resetHistory()
      const messageSent = new Promise(resolve =>
        stub(BaseWebview.prototype, 'show').callsFake(() => {
          resolve(undefined)
          return Promise.resolve(true)
        })
      )

      mockMessageReceived.fire({
        type: MessageFromWebviewType.SAVE_STUDIO_TOKEN
      })

      await messageSent

      expect(mockInputBox).to.be.called
      expect(mockConfig).to.be.calledWithExactly(
        getFirstWorkspaceFolder(),
        Flag.GLOBAL,
        ConfigKey.STUDIO_TOKEN,
        mockToken
      )
      expect(mockConfig).to.be.calledWithExactly(
        getFirstWorkspaceFolder(),
        ConfigKey.STUDIO_TOKEN
      )
      expect(executeCommandSpy).to.be.calledWithExactly(
        'setContext',
        ContextKey.STUDIO_CONNECTED,
        true
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to set studio.offline (share live experiments)', async () => {
      const { mockConfig, setup } = buildSetup({ disposer: disposable })
      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(setup as any, 'getCliCompatible')
        .onFirstCall()
        .returns(true)
        .onSecondCall()
        .returns(undefined)

      mockMessageReceived.fire({
        payload: false,
        type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
      })

      expect(mockConfig).to.be.calledWithExactly(
        dvcDemoPath,
        '--global',
        'studio.offline',
        'true'
      )
      mockConfig.resetHistory()

      mockMessageReceived.fire({
        payload: false,
        type: MessageFromWebviewType.SET_STUDIO_SHARE_EXPERIMENTS_LIVE
      })

      expect(mockConfig).not.to.be.called
    })

    it('should be able to delete the Studio access token from the global dvc config', async () => {
      const mockConfig = stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DvcConfig.prototype,
        'config'
      ).resolves(undefined)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(Setup.prototype as any, 'getCliCompatible').returns(true)

      await commands.executeCommand(
        RegisteredCommands.REMOVE_STUDIO_ACCESS_TOKEN
      )

      expect(mockConfig).to.be.calledWithExactly(
        dvcDemoPath,
        Flag.GLOBAL,
        Flag.UNSET,
        ConfigKey.STUDIO_TOKEN
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should check if experiments and dvc are setup', async () => {
      const { setup } = buildSetup({
        disposer: disposable,
        hasData: false,
        noDvcRoot: false
      })

      setup.setCliCompatibleAndVersion(true, MIN_CLI_VERSION)
      setup.setAvailable(true)
      await setup.setRoots()

      expect(setup.shouldBeShown()).to.deep.equal({
        dvc: true,
        experiments: false
      })

      setup.setCliCompatibleAndVersion(undefined, undefined)
      setup.setAvailable(false)
      await setup.setRoots()

      expect(setup.shouldBeShown()).to.deep.equal({
        dvc: false,
        experiments: false
      })
    })

    it('should handle a message to open the experiments webview', async () => {
      const { messageSpy, setup, mockShowWebview, mockExecuteCommand } =
        buildSetup({ disposer: disposable })

      const webview = await setup.showWebview()
      await webview.isReady()
      mockExecuteCommand.restore()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const showWebviewCalled = new Promise(resolve =>
        mockShowWebview.callsFake(() => {
          resolve(undefined)
          return Promise.resolve(undefined)
        })
      )
      stub(Setup.prototype, 'shouldBeShown').returns({
        dvc: true,
        experiments: true
      })

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.OPEN_EXPERIMENTS_WEBVIEW
      })

      await showWebviewCalled
      expect(mockShowWebview).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to add a remote', async () => {
      const { messageSpy, setup, mockExecuteCommand } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()
      mockExecuteCommand.restore()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockRemote = stub(DvcConfig.prototype, 'remote')

      const remoteAdded = new Promise(resolve =>
        mockRemote.callsFake((_, ...args) => {
          if (args.includes('add')) {
            resolve(undefined)
          }
          return Promise.resolve('')
        })
      )

      const mockShowInputBox = stub(window, 'showInputBox')
        .onFirstCall()
        .resolves('storage')
        .onSecondCall()
        .resolves('s3://my-bucket')

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.REMOTE_ADD
      })

      await remoteAdded

      expect(mockShowInputBox).to.be.calledTwice
      expect(
        mockRemote,
        'new remote is set as the default'
      ).to.be.calledWithExactly(
        dvcDemoPath,
        'add',
        '-d',
        '--project',
        'storage',
        's3://my-bucket'
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to add a remote', async () => {
      const mockRemote = stub(DvcConfig.prototype, 'remote')

      const remoteAdded = new Promise(resolve =>
        mockRemote.callsFake((_, ...args) => {
          if (args.includes('list')) {
            return Promise.resolve('storage s3://my-bucket')
          }

          if (args.includes('add')) {
            resolve(undefined)
          }
          return Promise.resolve('')
        })
      )

      const mockShowInputBox = stub(window, 'showInputBox')
        .onFirstCall()
        .resolves('backup')
        .onSecondCall()
        .resolves('s3://my-backup-bucket')

      const mockShowQuickPick = (
        stub(window, 'showQuickPick') as SinonStub<
          [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
          Thenable<QuickPickItemWithValue<boolean> | undefined>
        >
      ).resolves({
        label: 'No',
        value: false
      })

      await commands.executeCommand(RegisteredCliCommands.REMOTE_ADD)

      await remoteAdded

      expect(mockShowInputBox).to.be.calledTwice
      expect(mockShowQuickPick).to.be.calledOnce
      expect(
        mockRemote,
        'should not set a remote as the default unless the user explicitly chooses to'
      ).to.be.calledWithExactly(
        dvcDemoPath,
        'add',
        '--project',
        'backup',
        's3://my-backup-bucket'
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to rename a remote', async () => {
      const mockRemote = stub(DvcConfig.prototype, 'remote')
      const newName = 'better-name'

      const remoteRenamed = new Promise(resolve =>
        mockRemote.callsFake((_, ...args) => {
          if (args.includes('list') && args.includes('--project')) {
            return Promise.resolve('storage s3://my-bucket')
          }

          if (args.includes('list')) {
            return Promise.resolve('')
          }

          if (args.includes('rename')) {
            resolve(undefined)
          }
          return Promise.resolve('')
        })
      )

      const mockShowInputBox = stub(window, 'showInputBox').resolves(newName)

      const mockShowQuickPick = (
        stub(window, 'showQuickPick') as SinonStub<
          [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
          Thenable<string | undefined>
        >
      ).resolves('Name')

      await commands.executeCommand(RegisteredCliCommands.REMOTE_MODIFY)

      await remoteRenamed

      expect(mockShowInputBox).to.be.calledOnce
      expect(mockShowQuickPick).to.be.calledOnce
      expect(mockRemote).to.be.calledWithExactly(
        dvcDemoPath,
        'rename',
        '--project',
        'storage',
        newName
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to modify a remote (modify URL)', async () => {
      const { messageSpy, setup, mockExecuteCommand } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()
      mockExecuteCommand.restore()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockRemote = stub(DvcConfig.prototype, 'remote')
      const projectConfigUrl = 's3://different-url'

      const remoteModified = new Promise(resolve =>
        mockRemote.callsFake((_, ...args) => {
          if (args.includes('list') && args.includes('--project')) {
            return Promise.resolve(
              `storage ${projectConfigUrl}\nbackup s3://my-backup-bucket`
            )
          }

          if (args.includes('list') && args.includes('--local')) {
            return Promise.resolve('storage s3://my-bucket')
          }

          if (args.includes('modify')) {
            resolve(undefined)
          }
          return Promise.resolve('')
        })
      )

      const mockShowInputBox = stub(window, 'showInputBox').resolves(
        projectConfigUrl
      )

      const mockShowQuickPick = (
        stub(window, 'showQuickPick') as SinonStub<
          [items: readonly QuickPickItem[], options: QuickPickOptionsWithTitle],
          Thenable<
            | string
            | undefined
            | QuickPickItemWithValue<{ config: string; name: string }>
          >
        >
      )
        .onFirstCall()
        .resolves({
          label: 'storage',
          value: { config: '--local', name: 'storage' }
        })
        .onSecondCall()
        .resolves('URL')

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.REMOTE_MODIFY
      })

      await remoteModified

      expect(mockShowInputBox).to.be.calledOnce
      expect(mockShowQuickPick).to.be.calledTwice
      expect(mockRemote).to.be.calledWithExactly(
        dvcDemoPath,
        'modify',
        '--local',
        'storage',
        'url',
        projectConfigUrl
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a message to remove a remote', async () => {
      const { messageSpy, setup, mockExecuteCommand } = buildSetup({
        disposer: disposable
      })

      const webview = await setup.showWebview()
      await webview.isReady()
      mockExecuteCommand.restore()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      const mockRemote = stub(DvcConfig.prototype, 'remote')

      let calls = 0

      const remoteRemoved = new Promise(resolve =>
        mockRemote.callsFake((_, ...args) => {
          if (args.includes('list')) {
            return Promise.resolve('storage s3://my-bucket')
          }

          if (args.includes('remove')) {
            calls = calls + 1
          }
          if (calls === 2) {
            resolve(undefined)
          }
          return Promise.resolve('')
        })
      )

      stub(window, 'showWarningMessage').resolves(
        Response.REMOVE as unknown as MessageItem
      )

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.REMOTE_REMOVE
      })

      await remoteRemoved

      expect(mockRemote).to.be.calledWithExactly(
        dvcDemoPath,
        'remove',
        '--local',
        'storage'
      )
      expect(mockRemote).to.be.calledWithExactly(
        dvcDemoPath,
        'remove',
        '--project',
        'storage'
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should send the appropriate messages to the webview to focus different sections', async () => {
      const { setup, messageSpy } = buildSetup({ disposer: disposable })
      messageSpy.restore()

      const webview = await setup.showSetup()
      await webview.isReady()

      const mockShow = stub(webview, 'show')

      const getNewMessageReceived = () => {
        mockShow.resetHistory()
        mockShow.resetBehavior()
        return new Promise(resolve =>
          mockShow.callsFake(() => {
            resolve(undefined)
            return Promise.resolve(true)
          })
        )
      }

      const initialMessage = getNewMessageReceived()

      void setup.showSetup()

      await initialMessage

      expect(mockShow).to.be.calledWithMatch({ sectionCollapsed: undefined })

      const focusExperiments = getNewMessageReceived()

      void setup.showSetup(SetupSection.EXPERIMENTS)

      await focusExperiments

      expect(mockShow).to.be.calledWithMatch({
        sectionCollapsed: {
          [SetupSection.EXPERIMENTS]: false,
          [SetupSection.STUDIO]: true
        }
      })

      const focusStudio = getNewMessageReceived()

      void setup.showSetup(SetupSection.STUDIO)

      await focusStudio

      expect(mockShow).to.be.calledWithMatch({
        sectionCollapsed: {
          [SetupSection.EXPERIMENTS]: true,
          [SetupSection.STUDIO]: false
        }
      })

      const openUnchanged = getNewMessageReceived()

      void setup.showSetup()

      await openUnchanged

      expect(mockShow).to.be.calledWithMatch({ sectionCollapsed: undefined })
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should open the webview with the Studio section focus for dvc.showStudioSettings and dvc.showStudioConnect', async () => {
      const mockShowWebview = stub(Setup.prototype, 'showSetup').resolves(
        undefined
      )

      await commands.executeCommand(
        RegisteredCommands.SETUP_SHOW_STUDIO_CONNECT
      )

      expect(mockShowWebview).to.be.calledWithExactly(SetupSection.STUDIO)

      mockShowWebview.resetHistory()

      await commands.executeCommand(
        RegisteredCommands.SETUP_SHOW_STUDIO_SETTINGS
      )

      expect(mockShowWebview).to.be.calledWithExactly(SetupSection.STUDIO)
    })
  })
})
