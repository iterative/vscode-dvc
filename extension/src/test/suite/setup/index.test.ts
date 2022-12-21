import { afterEach, beforeEach, describe, it, suite } from 'mocha'
import { expect } from 'chai'
import { restore, spy } from 'sinon'
import { buildSetup } from './util'
import { closeAllEditors, getMessageReceivedEmitter } from '../util'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { MessageFromWebviewType } from '../../../webview/contract'
import { Disposable } from '../../../extension'
import { Logger } from '../../../common/logger'
import { BaseWebview } from '../../../webview'

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
    it('should handle a initialize project message from the webview', async () => {
      const { messageSpy, setup, mockInitializeProject } = buildSetup(
        disposable,
        true
      )

      const webview = await setup.showWebview()
      await webview.isReady()

      const mockMessageReceived = getMessageReceivedEmitter(webview)

      messageSpy.resetHistory()
      mockMessageReceived.fire({
        type: MessageFromWebviewType.INITIALIZE_PROJECT
      })

      expect(mockInitializeProject).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should log an error message if the message from the webview is anything else than initialize project', async () => {
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
      const { setup, mockOpenExperiments } = buildSetup(
        disposable,
        true,
        true,
        true
      )

      const closeWebviewSpy = spy(BaseWebview.prototype, 'dispose')

      const webview = await setup.showWebview()
      await webview.isReady()

      expect(closeWebviewSpy).to.be.calledOnce
      expect(mockOpenExperiments).to.be.calledOnce
    }).timeout(WEBVIEW_TEST_TIMEOUT)
  })
})
