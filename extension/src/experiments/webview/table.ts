import { react, main } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import { ExperimentsWebview } from '.'
import { ExperimentsWebviewState } from './contract'
import { InternalCommands } from '../../commands/internal'
import { ResourceLocator } from '../../resourceLocator'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'

const tableScripts = [react, main]

export class TableWebview extends ExperimentsWebview {
  public static viewKey = 'dvc-experiments'

  private constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ) {
    super(webviewPanel, internalCommands, state, tableScripts)

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
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState,
    resourceLocator: ResourceLocator
  ) {
    return ExperimentsWebview.create(
      internalCommands,
      state,
      resourceLocator,
      'Experiments',
      TableWebview.viewKey,
      tableScripts
    )
  }

  public static restore(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ) {
    return ExperimentsWebview.restore(
      webviewPanel,
      internalCommands,
      state,
      tableScripts
    )
  }
}
