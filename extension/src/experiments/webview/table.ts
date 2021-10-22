import { distPath, main } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import { ExperimentsWebview } from '.'
import { ExperimentsWebviewState } from './contract'
import { InternalCommands } from '../../commands/internal'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'

export class TableWebview extends ExperimentsWebview {
  public static distPath = distPath
  public static title = 'Experiments'
  public static viewKey = 'dvc-experiments'

  constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ) {
    super(webviewPanel, internalCommands, state, [main])

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_TABLE_CREATED,
      undefined,
      undefined
    )

    this.onDidDispose(() => {
      sendTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_TABLE_CLOSED,
        undefined,
        undefined
      )
    })

    this.onDidChangeIsFocused(() => {
      sendTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_TABLE_FOCUS_CHANGED,
        {
          active: webviewPanel.active,
          viewColumn: webviewPanel.viewColumn,
          visible: webviewPanel.visible
        },
        undefined
      )
    })
  }

  public static create(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ): TableWebview {
    return new TableWebview(webviewPanel, internalCommands, state)
  }

  public static restore(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ): Promise<TableWebview> {
    return ExperimentsWebview.restore(webviewPanel, internalCommands, state, [
      main
    ])
  }
}
