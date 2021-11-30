import { Uri, ViewColumn, WebviewPanel, window } from 'vscode'
import isEqual from 'lodash.isequal'
import { BaseWebview } from '.'
import { ViewKey, WebviewDetails } from './constants'
import { WebviewState, UnknownWebviewState, WebviewData } from './contract'
import { Resource } from '../resourceLocator'
import { TableData } from '../experiments/webview/contract'
import { PlotsData } from '../plots/webview/contract'
import { hasKey } from '../util/object'
import { getWorkspaceRootUris } from '../vscode/workspaceFolders'

const isExperimentsWebviewState = (state: UnknownWebviewState): boolean => {
  const data = state.data as TableData
  return !!(data?.rows && data?.columns)
}

const isPlotsWebviewState = (state: UnknownWebviewState): boolean => {
  const data = state.data as PlotsData
  return !!(isEqual(data, {}) || hasKey(data, 'live') || hasKey(data, 'static'))
}

export const isValidState = (
  viewKey: ViewKey,
  state: UnknownWebviewState
): state is WebviewState<WebviewData> =>
  (viewKey === ViewKey.EXPERIMENTS && isExperimentsWebviewState(state)) ||
  (viewKey === ViewKey.PLOTS && isPlotsWebviewState(state))

const create = (
  viewKey: ViewKey,
  webviewPanel: WebviewPanel,
  state: UnknownWebviewState
) => {
  if (!isValidState(viewKey, state)) {
    throw new Error(`trying to set invalid state into ${viewKey}`)
  }

  const { contextKey, eventNames, scripts } = WebviewDetails[viewKey]

  return new BaseWebview(webviewPanel, state, contextKey, eventNames, scripts)
}

export const createWebview = async (
  viewKey: ViewKey,
  state: UnknownWebviewState,
  iconPath: Resource
) => {
  const { title, distPath } = WebviewDetails[viewKey]

  const webviewPanel = window.createWebviewPanel(
    viewKey,
    title,
    ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [Uri.file(distPath), ...getWorkspaceRootUris()],
      retainContextWhenHidden: true
    }
  )

  webviewPanel.iconPath = iconPath

  const view = create(viewKey, webviewPanel, state)
  await view.isReady()
  return view
}

export const restoreWebview = <T extends WebviewData>(
  viewKey: ViewKey,
  webviewPanel: WebviewPanel,
  state: UnknownWebviewState
): Promise<BaseWebview<T>> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(create(viewKey, webviewPanel, state))
    } catch (e: unknown) {
      reject(e)
    }
  })
}
