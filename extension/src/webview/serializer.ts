import { window, WebviewPanel } from 'vscode'
import { Disposable } from '@hediet/std/disposable'
import { ViewKey } from './constants'
import { WebviewData, WebviewState } from './contract'
import { restoreWebview } from './factory'
import { BaseRepository } from './repository'
import { BaseWorkspaceWebviews } from './workspace'
import { InternalCommands } from '../commands/internal'
import { WorkspaceExperiments } from '../experiments/workspace'
import { TableData } from '../experiments/webview/contract'
import { WorkspacePlots } from '../plots/workspace'
import { PlotsData } from '../plots/webview/contract'

export class WebviewSerializer {
  public readonly dispose = Disposable.fn()

  constructor(
    internalCommands: InternalCommands,
    experiments: WorkspaceExperiments,
    plots: WorkspacePlots
  ) {
    this.addSerializer<TableData>(
      ViewKey.EXPERIMENTS,
      internalCommands,
      experiments
    )

    this.addSerializer<PlotsData>(ViewKey.PLOTS, internalCommands, plots)
  }

  private addSerializer<T extends WebviewData>(
    viewKey: ViewKey,
    internalCommands: InternalCommands,
    workspace: BaseWorkspaceWebviews<BaseRepository<T>, T>
  ) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(viewKey, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: WebviewState<T>
        ) => {
          const dvcRoot = state?.dvcRoot
          const webview = await restoreWebview(
            viewKey,
            panel,
            internalCommands,
            state
          )
          await workspace.isReady()
          workspace.setWebview(dvcRoot, webview)
        }
      })
    )
  }
}
