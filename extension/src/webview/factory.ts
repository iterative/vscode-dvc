import { Uri, ViewColumn, WebviewPanel, window } from 'vscode'
import { WebviewState } from './contract'
import { InternalCommands } from '../commands/internal'
import {
  ExperimentsWebview,
  isExperimentsWebviewState
} from '../experiments/webview'
import { Resource } from '../resourceLocator'
import { isPlotsWebviewState, PlotsWebview } from '../plots/webview'

type WebviewType = typeof ExperimentsWebview | typeof PlotsWebview

const isExperimentsWebview = (
  webviewType: typeof ExperimentsWebview | typeof PlotsWebview
): webviewType is typeof ExperimentsWebview =>
  typeof webviewType === typeof ExperimentsWebview

const create = (
  webviewType: WebviewType,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: WebviewState<unknown>
): ExperimentsWebview | PlotsWebview => {
  if (isExperimentsWebview(webviewType)) {
    if (!isExperimentsWebviewState(state)) {
      throw new Error(
        'trying to create an experiments webview with the wrong state'
      )
    }

    return ExperimentsWebview.create(webviewPanel, internalCommands, state)
  }

  if (!isPlotsWebviewState(state)) {
    throw new Error('trying to create a plots webview with the wrong state')
  }

  return PlotsWebview.create(webviewPanel, internalCommands, state)
}

export const createWebview = async (
  webviewType: WebviewType,
  internalCommands: InternalCommands,
  state: WebviewState<unknown>,
  iconPath: Resource
): Promise<ExperimentsWebview | PlotsWebview> => {
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

  const view = create(webviewType, webviewPanel, internalCommands, state)
  await view.isReady()
  return view
}

export const restoreWebview = <T extends WebviewType>(
  webviewType: T,
  webviewPanel: WebviewPanel,
  internalCommands: InternalCommands,
  state: WebviewState<unknown>
): Promise<PlotsWebview | ExperimentsWebview> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(create(webviewType, webviewPanel, internalCommands, state))
    } catch (e: unknown) {
      reject(e)
    }
  })
}
