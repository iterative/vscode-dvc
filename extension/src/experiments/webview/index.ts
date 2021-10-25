import { distPath, main } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import { TableData, WebviewState, WebviewType } from './contract'
import { InternalCommands } from '../../commands/internal'
import { EventName } from '../../telemetry/constants'
import { BaseWebview } from '../../webview'
import { WebviewState as GenericWebviewState } from '../../webview/contract'

export const isExperimentsWebviewState = (
  state: GenericWebviewState<unknown>
): state is WebviewState => {
  const tableData = state.webviewData as TableData
  return !tableData || !!(tableData.rows && tableData.columns)
}

export class ExperimentsWebview extends BaseWebview<TableData> {
  public static distPath = distPath
  public static title = WebviewType
  public static viewKey = 'dvc-experiments'
  public static contextKey = 'dvc.experiments.webviewActive'

  private constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: WebviewState
  ) {
    super(
      webviewPanel,
      internalCommands,
      state,
      {
        closedEvent: EventName.VIEWS_EXPERIMENTS_TABLE_CLOSED,
        createdEvent: EventName.VIEWS_EXPERIMENTS_TABLE_CREATED,
        focusChangedEvent: EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED
      },
      ExperimentsWebview.contextKey,
      [main]
    )
  }

  public static create(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: WebviewState
  ): ExperimentsWebview {
    return new ExperimentsWebview(webviewPanel, internalCommands, state)
  }
}
