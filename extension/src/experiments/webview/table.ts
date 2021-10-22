import { distPath, main } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import { autorun } from 'mobx'
import { ExperimentsWebview } from '.'
import {
  ExperimentsWebviewState,
  MessageToWebviewType,
  TableData
} from './contract'
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

    this.disposer.track({
      dispose: autorun(async () => {
        await this.isReady() // Read all mobx dependencies before await
        const data = state.data
        if (data) {
          this.sendMessage({
            data,
            type: MessageToWebviewType.setData
          })
        }
      })
    })
  }

  public static create(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ): TableWebview {
    return new TableWebview(webviewPanel, internalCommands, state)
  }

  public async showExperiments(payload: {
    data: TableData
    errors?: Error[]
  }): Promise<boolean> {
    await this.isReady()
    return this.sendMessage({
      type: MessageToWebviewType.setData,
      ...payload
    })
  }
}
