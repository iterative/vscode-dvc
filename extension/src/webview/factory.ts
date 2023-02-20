import { Uri, ViewColumn, WebviewPanel, window } from 'vscode'
import { BaseWebview } from '.'
import { ViewKey, WebviewDetails } from './constants'
import { Resource } from '../resourceLocator'
import { getWorkspaceRootUris } from '../vscode/workspaceFolders'

export const GLOBAL_WEBVIEW_DVCROOT = 'n/a'

const isValidDvcRoot = (dvcRoot?: string): dvcRoot is string => !!dvcRoot

const create = (
  viewKey: ViewKey,
  webviewPanel: WebviewPanel,
  dvcRoot: string
) => {
  if (!isValidDvcRoot(dvcRoot)) {
    throw new Error(`trying to set invalid state into ${viewKey}`)
  }

  const { contextKey, eventNames, scripts } = WebviewDetails[viewKey]

  return new BaseWebview(webviewPanel, dvcRoot, contextKey, eventNames, scripts)
}

export const createWebview = async (
  viewKey: ViewKey,
  dvcRoot: string,
  iconPath: Resource,
  viewColumn?: ViewColumn
) => {
  const { title, distPath } = WebviewDetails[viewKey]

  const webviewPanel = window.createWebviewPanel(
    viewKey,
    title,
    viewColumn || ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [Uri.file(distPath), ...getWorkspaceRootUris()],
      retainContextWhenHidden: true
    }
  )

  webviewPanel.iconPath = iconPath

  const view = create(viewKey, webviewPanel, dvcRoot)
  await view.isReady()
  return view
}
