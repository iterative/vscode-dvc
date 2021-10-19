import { react, plots } from 'dvc-vscode-webview'
import { WebviewPanel } from 'vscode'
import { ExperimentsWebview } from '.'
import { ExperimentsWebviewState } from './contract'
import { InternalCommands } from '../../commands/internal'
import { ResourceLocator } from '../../resourceLocator'
import { sendTelemetryEvent } from '../../telemetry'
import { EventName } from '../../telemetry/constants'

const plotsScripts = [react, plots]

export class PlotsWebview extends ExperimentsWebview {
  public static viewKey = 'dvc-experiments-plots'

  private constructor(
    webviewPanel: WebviewPanel,
    internalCommands: InternalCommands,
    state: ExperimentsWebviewState
  ) {
    super(webviewPanel, internalCommands, state, plotsScripts)

    sendTelemetryEvent(
      EventName.VIEWS_EXPERIMENTS_PLOTS_CREATED,
      undefined,
      undefined
    )

    this.onDidDispose(() => {
      sendTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_PLOTS_CLOSED,
        undefined,
        undefined
      )
    })

    this.onDidChangeIsFocused(() => {
      sendTelemetryEvent(
        EventName.VIEWS_EXPERIMENTS_PLOTS_FOCUS_CHANGED,
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
      PlotsWebview.viewKey,
      plotsScripts
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
      plotsScripts
    )
  }
}
