import { distPath, main } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import { autorun } from 'mobx'

import {
  ExperimentsWebviewState,
  MessageToWebviewType,
  TableData
} from './contract'
import { InternalCommands } from '../../commands/internal'
import { EventName } from '../../telemetry/constants'
import { BaseWebview } from '../../webview'

export class ExperimentsWebview extends BaseWebview {
  public static distPath = distPath
  public static title = 'Experiments'
  public static viewKey = 'dvc-experiments'
  public static contextKey = 'dvc.experiments.webviewActive'

  constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
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

    this.disposer.track({
      dispose: autorun(async () => {
        await this.isReady() // Read all mobx dependencies before await
        const tableData = state.tableData
        if (tableData) {
          this.sendMessage({
            tableData,
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
  ): ExperimentsWebview {
    return new ExperimentsWebview(webviewPanel, internalCommands, state)
  }

  public async showExperiments(payload: {
    tableData: TableData
    errors?: Error[]
  }): Promise<boolean> {
    await this.isReady()
    return this.sendMessage({
      type: MessageToWebviewType.setData,
      ...payload
    })
  }
}
