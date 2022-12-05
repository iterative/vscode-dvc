import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy } from 'sinon'
import { buildGetStarted } from './util'
import { closeAllEditors, getMessageReceivedEmitter } from '../util'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { MessageFromWebviewType } from '../../../webview/contract'
import { AvailableCommands } from '../../../commands/internal'
import { Disposable } from '../../../extension'
import { Logger } from '../../../common/logger'

suite('GetStarted Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(function () {
    this.timeout(6000)
    disposable.dispose()
    return closeAllEditors()
  })

  describe('Get Started', () => {
    it('should handle a initialize project message from the webview', async () => {
      const { messageSpy, getStarted, internalCommands } =
        await buildGetStarted(disposable)

      const webview = await getStarted.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)
      const mockInitializeProject = spy(internalCommands, 'executeCommand')

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.INITIALIZE_PROJECT
      })

      expect(mockInitializeProject).to.be.calledOnce

      expect(mockInitializeProject).to.be.calledWithExactly(
        AvailableCommands.INIT
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should log an error message if the message from the webview is anything else than initialize project', async () => {
      const { messageSpy, getStarted } = await buildGetStarted(disposable)

      const webview = await getStarted.showWebview()
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
  })
})
