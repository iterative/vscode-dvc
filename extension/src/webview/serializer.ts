import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { TableWebview } from '../experiments/webview/table'
import { WorkspaceExperiments } from '../experiments/workspace'
import { ExperimentsWebviewState } from '../experiments/webview/contract'
import { InternalCommands } from '../commands/internal'
import { restoreWebview } from '../webview/factory'

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
          const experimentsWebview = await restoreWebview(
            TableWebview,
            panel,
            internalCommands,
            state
          )
          await experiments.isReady()
          experiments.setWebview(dvcRoot, experimentsWebview)
        }
      })
    )
  }
}
