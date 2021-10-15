import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { restoreTableWebview, WebviewKeys } from '../experiments/webview'
import { WorkspaceExperiments } from '../experiments/workspace'
import { ExperimentsWebviewState } from '../experiments/webview/contract'
import { InternalCommands } from '../commands/internal'

export class WebviewSerializer {
  public readonly dispose = Disposable.fn()

  constructor(
    internalCommands: InternalCommands,
    experiments: WorkspaceExperiments
  ) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(WebviewKeys.TABLE, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: ExperimentsWebviewState
        ) => {
          const dvcRoot = state?.dvcRoot
          const experimentsWebview = await restoreTableWebview(
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
