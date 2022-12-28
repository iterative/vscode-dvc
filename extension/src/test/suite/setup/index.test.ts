import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import { buildSetup } from './util'
import { closeAllEditors, getMessageReceivedEmitter } from '../util'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { MessageFromWebviewType } from '../../../webview/contract'
import { Disposable } from '../../../extension'
import { Logger } from '../../../common/logger'
import { BaseWebview } from '../../../webview'
import { RegisteredCommands } from '../../../commands/external'

suite('Setup Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    disposable.dispose()
    return closeAllEditors()
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
      const { messageSpy, setup, mockInitializeDvc } = buildSetup(disposable)

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.INITIALIZE_DVC
      })

      expect(mockInitializeDvc).to.be.calledOnce
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
      const { messageSpy, setup, mockExecuteCommand } = buildSetup(disposable)
      const setInterpreterCommand = 'python.setInterpreter'

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.SELECT_PYTHON_INTERPRETER
      })

      expect(mockExecuteCommand).to.be.calledWithExactly(setInterpreterCommand)
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should handle a setup the workspace message from the webview', async () => {
      const { messageSpy, setup, mockExecuteCommand } = buildSetup(disposable)

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
          return mockSendMessage.wrappedMethod(data)
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
          return mockSendMessage.wrappedMethod(data)
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
          return mockSendMessage.wrappedMethod(data)
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
        needsGitInitialized: false,
        projectInitialized: false,
        pythonBinPath: undefined
      })
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })
})
