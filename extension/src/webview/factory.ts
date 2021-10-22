import { Uri, ViewColumn, WebviewPanel, window } from 'vscode'
import { InternalCommands } from '../commands/internal'
import {
  ExperimentsWebviewState,
  WebviewType
} from '../experiments/webview/contract'
import { TableWebview } from '../experiments/webview/table'
import { Resource } from '../resourceLocator'

export type WebviewState = ExperimentsWebviewState
type WebviewType = typeof TableWebview

export const create = async (
  webviewType: WebviewType,
  internalCommands: InternalCommands,
  state: WebviewState,
  iconPath: Resource
): Promise<TableWebview> => {
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

export const restore = (
  webviewType: WebviewType,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: WebviewState
): Promise<TableWebview> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(webviewType.create(webviewPanel, internalCommands, state))
    } catch (e: unknown) {
      reject(e)
    }
  })
}
