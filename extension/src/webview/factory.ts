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
  type: WebviewType,
  internalCommands: InternalCommands,
  state: WebviewState,
  iconPath: Resource
): Promise<TableWebview> => {
  const webviewPanel = window.createWebviewPanel(
    type.viewKey,
    type.title,
    ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [Uri.file(type.distPath)],
      retainContextWhenHidden: true
    }
  )

  webviewPanel.iconPath = iconPath

  const view = type.create(webviewPanel, internalCommands, state)
  await view.isReady()
  return view
}

export const restore = (
  type: typeof TableWebview,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: WebviewState
): Promise<TableWebview> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(type.create(webviewPanel, internalCommands, state))
    } catch (e: unknown) {
      reject(e)
    }
  })
}
