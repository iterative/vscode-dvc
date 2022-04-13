import { window, WebviewPanel } from 'vscode'
import { Deferred } from '@hediet/std/synchronization'
import { ViewKey } from './constants'
import { WebviewData, WebviewState } from './contract'
import { restoreWebview } from './factory'
import { BaseRepository } from './repository'
import { BaseWorkspaceWebviews } from './workspace'
import { WorkspaceExperiments } from '../experiments/workspace'
import { TableData } from '../experiments/webview/contract'
import { WorkspacePlots } from '../plots/workspace'
import { PlotsData } from '../plots/webview/contract'
import { Disposable } from '../class/dispose'

export class WebviewSerializer extends Disposable {
  private deferred = new Deferred()
  private dropOrphaned = false

  constructor(experiments: WorkspaceExperiments, plots: WorkspacePlots) {
    super()

    this.registerSerializer<TableData>(ViewKey.EXPERIMENTS, experiments)

    this.registerSerializer<PlotsData>(ViewKey.PLOTS, plots)
  }

  public reset() {
    this.dropOrphaned = true
    this.deferred.resolve()
  }

  private registerSerializer<T extends WebviewData>(
    viewKey: ViewKey,
    workspace: BaseWorkspaceWebviews<BaseRepository<T>, T>
  ) {
    this.dispose.track(
      window.registerWebviewPanelSerializer(viewKey, {
        deserializeWebviewPanel: async (
          panel: WebviewPanel,
          state: WebviewState
        ) => {
          const dvcRoot = state?.dvcRoot

          const webview = await restoreWebview(viewKey, panel, state)

          await Promise.race([workspace.isReady(), this.deferred.promise])

          if (this.dropOrphaned) {
            webview.dispose()
            return
          }

          workspace.setWebview(dvcRoot, webview)
        }
      })
    )
  }
}
