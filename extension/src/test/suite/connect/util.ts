import { ExtensionContext, SecretStorage, env } from 'vscode'
import { stub } from 'sinon'
import { Disposer } from '../../../extension'
import { buildResourceLocator, getMessageReceivedEmitter } from '../util'
import { Connect } from '../../../connect'

export const buildConnect = async (
  disposer: Disposer,
  mockSecretStorage?: SecretStorage
) => {
  const resourceLocator = buildResourceLocator(disposer)
  const connect = disposer.track(
    new Connect(
      {
        secrets: mockSecretStorage || { get: stub(), onDidChange: stub() }
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
