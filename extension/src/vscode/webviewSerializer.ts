import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from '../experiments/webview'
import { Experiments } from '../experiments'
import { ExperimentsWebviewState } from '../experiments/webview/contract'
import { InternalCommands } from '../commands/internal'

export class WebviewSerializer {
  public readonly dispose = Disposable.fn()

  constructor(internalCommands: InternalCommands, experiments: Experiments) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(ExperimentsWebview.viewKey, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: ExperimentsWebviewState
        ) => {
          const dvcRoot = state?.dvcRoot
          const experimentsWebview = await ExperimentsWebview.restore(
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
