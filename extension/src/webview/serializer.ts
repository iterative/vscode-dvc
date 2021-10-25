import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ViewKey } from './constants'
import { WebviewState } from './contract'
import { restoreWebview } from './factory'
import { WorkspaceExperiments } from '../experiments/workspace'
import { InternalCommands } from '../commands/internal'
import { TableData } from '../experiments/webview/contract'

export class WebviewSerializer {
  public readonly dispose = Disposable.fn()

  constructor(
    internalCommands: InternalCommands,
    experiments: WorkspaceExperiments
  ) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(ViewKey.EXPERIMENTS, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: WebviewState<TableData>
        ) => {
          const dvcRoot = state?.dvcRoot
          const experimentsWebview = await restoreWebview(
            ViewKey.EXPERIMENTS,
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
