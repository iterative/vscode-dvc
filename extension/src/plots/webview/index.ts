import { distPath, main } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import { PlotsData, WebviewState } from './contract'
import { InternalCommands } from '../../commands/internal'
import { EventName } from '../../telemetry/constants'
import { BaseWebview } from '../../webview'
import {
  MessageToWebview,
  MessageToWebviewType,
  WebviewState as GenericWebviewState
} from '../../webview/contract'

const isPlotsWebviewState = (
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

  constructor(
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
    state: GenericWebviewState<unknown>
  ): PlotsWebview {
    if (!isPlotsWebviewState(state)) {
      throw new Error('trying to create a plots webview with the wrong state')
    }

    return new PlotsWebview(webviewPanel, internalCommands, state)
  }

  public async showPlots(payload: {
    webviewData: PlotsData
    errors?: Error[]
  }): Promise<boolean> {
    await this.isReady()
    return this.sendMessage<MessageToWebview<PlotsData>>({
      type: MessageToWebviewType.setData,
      ...payload
    })
  }
}
