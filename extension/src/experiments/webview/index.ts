import { distPath, main } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import {
  MessageToWebview,
  TableData,
  WebviewState,
  WebviewType
} from './contract'
import { InternalCommands } from '../../commands/internal'
import { EventName } from '../../telemetry/constants'
import { BaseWebview } from '../../webview'
import {
  WebviewState as GenericWebviewState,
  MessageToWebviewType
} from '../../webview/contract'

const isExperimentsWebviewState = (
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
    state: GenericWebviewState<unknown>
  ): ExperimentsWebview {
    if (!isExperimentsWebviewState(state)) {
      throw new Error(
        'trying to create an experiments webview with the wrong state'
      )
    }

    return new ExperimentsWebview(webviewPanel, internalCommands, state)
  }

  public async showExperiments(payload: {
    webviewData: TableData
    errors?: Error[]
  }): Promise<boolean> {
    await this.isReady()
    return this.sendMessage<MessageToWebview>({
      type: MessageToWebviewType.setData,
      ...payload
    })
  }
}
