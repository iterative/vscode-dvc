import { Uri, ViewColumn, WebviewPanel, window } from 'vscode'
import { InternalCommands } from '../commands/internal'
import {
  ExperimentsWebviewState,
  WebviewType
} from '../experiments/webview/contract'
import { ExperimentsWebview } from '../experiments/webview'
import { Resource } from '../resourceLocator'

export type WebviewState = ExperimentsWebviewState
type WebviewType = typeof ExperimentsWebview

export const createWebview = async (
  webviewType: WebviewType,
  internalCommands: InternalCommands,
  state: WebviewState,
  iconPath: Resource
): Promise<ExperimentsWebview> => {
  const webviewPanel = window.createWebviewPanel(
    webviewType.viewKey,
    webviewType.title,
    ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [Uri.file(webviewType.distPath)],
      retainContextWhenHidden: true
    }
  )

  webviewPanel.iconPath = iconPath

  const view = webviewType.create(webviewPanel, internalCommands, state)
  await view.isReady()
  return view
}

export const restoreWebview = (
  webviewType: WebviewType,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: WebviewState
): Promise<ExperimentsWebview> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(webviewType.create(webviewPanel, internalCommands, state))
    } catch (e: unknown) {
      reject(e)
    }
  })
}
