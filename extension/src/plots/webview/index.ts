import { distPath, main } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import { PlotsData, WebviewState } from './contract'
import { InternalCommands } from '../../commands/internal'
import { EventName } from '../../telemetry/constants'
import { BaseWebview } from '../../webview'
import { WebviewState as GenericWebviewState } from '../../webview/contract'

export const isPlotsWebviewState = (
  state: GenericWebviewState<unknown>
): state is WebviewState => {
  const tableData = state.webviewData as PlotsData
  return !tableData || !!tableData.metrics
}

export class PlotsWebview extends BaseWebview<PlotsData> {
  public static distPath = distPath
  public static title = 'Plots'
  public static viewKey = 'dvc-plots'
  public static contextKey = 'dvc.plots.webviewActive'

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
        closedEvent: EventName.VIEWS_PLOTS_CLOSED,
        createdEvent: EventName.VIEWS_PLOTS_CREATED,
        focusChangedEvent: EventName.VIEWS_PLOTS_FOCUS_CHANGED
      },
      PlotsWebview.contextKey,
      [main]
    )
  }

  public static create(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: WebviewState
  ): PlotsWebview {
    return new PlotsWebview(webviewPanel, internalCommands, state)
  }
}
