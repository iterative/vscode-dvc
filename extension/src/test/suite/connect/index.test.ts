import { afterEach, beforeEach, suite, describe, it } from 'mocha'
import { expect } from 'chai'
import { restore, spy, stub } from 'sinon'
import {
  EventEmitter,
  ExtensionContext,
  SecretStorage,
  Uri,
  commands,
  env,
  window
} from 'vscode'
import { Disposable } from '../../../extension'
import {
  buildResourceLocator,
  closeAllEditors,
  getMessageReceivedEmitter
} from '../util'
import { Connect } from '../../../connect'
import { MessageFromWebviewType } from '../../../webview/contract'
import { WEBVIEW_TEST_TIMEOUT } from '../timeouts'
import { ContextKey } from '../../../vscode/context'
import { STUDIO_ACCESS_TOKEN_KEY } from '../../../connect/token'
import { RegisteredCommands } from '../../../commands/external'

suite('Connect Test Suite', () => {
  const disposable = Disposable.fn()

  beforeEach(() => {
    restore()
  })

  afterEach(() => {
    disposable.dispose()
    return closeAllEditors()
  })

  const buildConnect = async (mockSecretStorage?: SecretStorage) => {
    const resourceLocator = buildResourceLocator(disposable)
    const connect = disposable.track(
      new Connect(
        {
          secrets: mockSecretStorage || {
            get: stub().resolves(undefined),
            onDidChange: stub()
          }
        } as unknown as ExtensionContext,
        resourceLocator.dvcIcon
      )
    )

    const webview = await connect.showWebview()

    const mockMessageReceived = getMessageReceivedEmitter(webview)

    const mockOpenExternal = stub(env, 'openExternal')
    const urlOpenedEvent = new Promise(resolve =>
      mockOpenExternal.callsFake(() => {
        resolve(undefined)
        return Promise.resolve(true)
      })
    )

    return { connect, mockMessageReceived, mockOpenExternal, urlOpenedEvent }
  }

  describe('Connect', () => {
    it('should handle a message from the webview to open Studio', async () => {
      const { mockMessageReceived, mockOpenExternal, urlOpenedEvent } =
        await buildConnect()

      mockMessageReceived.fire({
        type: MessageFromWebviewType.OPEN_STUDIO
      })

      await urlOpenedEvent
      expect(mockOpenExternal).to.be.calledWith(
        Uri.parse('https://studio.iterative.ai')
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should handle a message from the webview to open the user's Studio profile", async () => {
      const { mockMessageReceived, mockOpenExternal, urlOpenedEvent } =
        await buildConnect()

      mockMessageReceived.fire({
        type: MessageFromWebviewType.OPEN_STUDIO_PROFILE
      })

      await urlOpenedEvent
      expect(mockOpenExternal).to.be.calledWith(
        Uri.parse(
          'https://studio.iterative.ai/user/_/profile?section=accessToken'
        )
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it("should handle a message from the webview to save the user's Studio access token", async () => {
      const executeCommandSpy = spy(commands, 'executeCommand')
      const secretsChanged = new EventEmitter<{ key: string }>()
      const mockToken = 'isat_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

      const mockSecrets: { [key: string]: string } = {}

      const onDidChange = secretsChanged.event
      const mockGetSecret = (key: string): Promise<string | undefined> =>
        Promise.resolve(mockSecrets[key])
      const mockStoreSecret = (key: string, value: string) => {
        mockSecrets[key] = value
        secretsChanged.fire({ key })
        return Promise.resolve(undefined)
      }

      const mockSecretStorage = {
        delete: stub(),
        get: mockGetSecret,
        onDidChange,
        store: mockStoreSecret
      }

      const secretsChangedEvent = new Promise(resolve =>
        onDidChange(() => resolve(undefined))
      )

      const { connect, mockMessageReceived } = await buildConnect(
        mockSecretStorage
      )
      await connect.isReady()
      expect(executeCommandSpy).to.be.calledWithExactly(
        'setContext',
        ContextKey.STUDIO_CONNECTED,
        false
      )

      const mockInputBox = stub(window, 'showInputBox').resolves(mockToken)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(Connect.prototype as any, 'getSecrets').returns(mockSecretStorage)

      mockMessageReceived.fire({
        type: MessageFromWebviewType.SAVE_STUDIO_TOKEN
      })

      await secretsChangedEvent

      expect(mockInputBox).to.be.called

      expect(await mockGetSecret(STUDIO_ACCESS_TOKEN_KEY)).to.equal(mockToken)

      expect(executeCommandSpy).to.be.calledWithExactly(
        'setContext',
        ContextKey.STUDIO_CONNECTED,
        true
      )
    }).timeout(WEBVIEW_TEST_TIMEOUT)

    it('should be able to delete the Studio access token from secrets storage', async () => {
      const mockDelete = stub()
      stub(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Connect.prototype as any,
        'getSecrets'
      ).returns({ delete: mockDelete })

      await commands.executeCommand(
        RegisteredCommands.REMOVE_STUDIO_ACCESS_TOKEN
      )

      expect(mockDelete).to.be.calledWithExactly(STUDIO_ACCESS_TOKEN_KEY)
    })
  })
})
