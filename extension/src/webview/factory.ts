import { Uri, ViewColumn, WebviewPanel, window } from 'vscode'
import { BaseWebview } from '.'
import { ViewKey, WebviewDetails } from './constants'
import { WebviewState, WebviewData } from './contract'
import { Resource } from '../resourceLocator'
import { getWorkspaceRootUris } from '../vscode/workspaceFolders'

export const isValidDvcRoot = (dvcRoot?: string): dvcRoot is string => !!dvcRoot

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
  iconPath: Resource
) => {
  const { title, distPath } = WebviewDetails[viewKey]

  const webviewPanel = window.createWebviewPanel(
    viewKey,
    title,
    ViewColumn.Active,
    {
      enableCommandUris: true,
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

export const restoreWebview = <T extends WebviewData>(
  viewKey: ViewKey,
  webviewPanel: WebviewPanel,
  state: WebviewState
): Promise<BaseWebview<T>> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(create(viewKey, webviewPanel, state.dvcRoot))
    } catch (error: unknown) {
      reject(error)
    }
  })
}
