import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './Experiments/Webview'
import { Config } from './Config'
import { Experiments } from './Experiments'
import { ExperimentsWebviewState } from './Experiments/Webview/contract'

export class WebviewSerializer {
  public readonly dispose = Disposable.fn()

  private readonly config: Config

  constructor(config: Config, experiments: Experiments) {
    this.config = config

    this.dispose.track(
      window.registerWebviewPanelSerializer(ExperimentsWebview.viewKey, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: ExperimentsWebviewState
        ) => {
          const dvcRoot = state?.dvcRoot
          const experimentsWebview = await ExperimentsWebview.restore(
            panel,
            this.config,
            state
          )
          await experiments.isReady()
          experiments.setWebview(dvcRoot, experimentsWebview)
        }
      })
    )
  }
}
