import { window, WebviewPanel } from 'vscode'
import { ViewKey } from './constants'
import { WebviewData, WebviewState } from './contract'
import { restoreWebview } from './factory'
import { BaseRepository } from './repository'
import { BaseWorkspaceWebviews } from './workspace'
import { WorkspaceExperiments } from '../experiments/workspace'
import { TableData } from '../experiments/webview/contract'
import { WorkspacePlots } from '../plots/workspace'
import { PlotsData } from '../plots/webview/contract'
import { BaseClass } from '../class'

export class WebviewSerializer extends BaseClass {
  constructor(experiments: WorkspaceExperiments, plots: WorkspacePlots) {
    super()

    this.registerSerializer<TableData>(ViewKey.EXPERIMENTS, experiments)

    this.registerSerializer<PlotsData>(ViewKey.PLOTS, plots)
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
          await workspace.isReady()
          workspace.setWebview(dvcRoot, webview)
        }
      })
    )
  }
}
