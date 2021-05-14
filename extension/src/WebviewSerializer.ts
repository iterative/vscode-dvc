import { EventEmitter, window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ExperimentsWebview } from './Experiments/Webview'
import { Config } from './Config'

export class WebviewSerializer {
  public readonly dispose = Disposable.fn()

  private readonly config: Config

  constructor(
    config: Config,
    activeExperimentsChanged: EventEmitter<string | undefined>
  ) {
    this.config = config

    this.dispose.track(
      window.registerWebviewPanelSerializer(ExperimentsWebview.viewKey, {
        deserializeWebviewPanel: async (panel: WebviewPanel) => {
          await ExperimentsWebview.restore(
            panel,
            this.config,
            activeExperimentsChanged
          )
        }
      })
    )
  }
}
