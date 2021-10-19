import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { TableWebview } from '../experiments/webview/table'
import { WorkspaceExperiments } from '../experiments/workspace'
import { ExperimentsWebviewState } from '../experiments/webview/contract'
import { InternalCommands } from '../commands/internal'
import { PlotsWebview } from '../experiments/webview/plots'

export class WebviewSerializer {
  public readonly dispose = Disposable.fn()

  constructor(
    internalCommands: InternalCommands,
    experiments: WorkspaceExperiments
  ) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(TableWebview.viewKey, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: ExperimentsWebviewState
        ) => {
          const dvcRoot = state?.dvcRoot
          const experimentsWebview = await TableWebview.restore(
            panel,
            internalCommands,
            state
          )
          await experiments.isReady()
          experiments.setTableWebview(dvcRoot, experimentsWebview)
        }
      })
    )
    this.dispose.track(
      window.registerWebviewPanelSerializer(PlotsWebview.viewKey, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: ExperimentsWebviewState
        ) => {
          const dvcRoot = state?.dvcRoot
          const experimentsWebview = await PlotsWebview.restore(
            panel,
            internalCommands,
            state
          )
          await experiments.isReady()
          experiments.setPlotsWebview(dvcRoot, experimentsWebview)
        }
      })
    )
  }
}
