import { Uri, ViewColumn, window } from 'vscode'
import { InternalCommands } from '../commands/internal'
import { TableWebview } from '../experiments/webview/table'
import { Resource } from '../resourceLocator'

export interface WebviewState<T = Record<string, unknown>> {
  dvcRoot: string
  data?: T
}

export const create = async (
  type: typeof TableWebview,
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
