import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsTableWebview } from '../experiments/webview'
import { Experiments } from '../experiments'
import { ExperimentsWebviewState } from '../experiments/webview/contract'
import { InternalCommands } from '../commands/internal'
import { PlotsWebview } from '../experiments/plotsWebview'

export class WebviewSerializer {
  public readonly dispose = Disposable.fn()

  constructor(internalCommands: InternalCommands, experiments: Experiments) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(ExperimentsTableWebview.viewKey, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: ExperimentsWebviewState
        ) => {
          const dvcRoot = state?.dvcRoot
          const experimentsWebview = await ExperimentsTableWebview.restore(
            panel,
            internalCommands,
            state
          )
          await experiments.isReady()
          experiments.setWebview(dvcRoot, experimentsWebview)
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
