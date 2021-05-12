import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from '../Experiments/Webview'
import { Config } from '../Config'

export class WebviewManager {
  public readonly dispose = Disposable.fn()

  constructor(private readonly config: Config) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(ExperimentsWebview.viewKey, {
        deserializeWebviewPanel: async (panel: WebviewPanel) => {
          await ExperimentsWebview.restore(panel, this.config)
        }
      })
    )
  }
}
