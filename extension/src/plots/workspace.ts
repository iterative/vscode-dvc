import { EventEmitter } from 'vscode'
import { Plots } from '.'
import { PlotsData } from './webview/contract'
import { ResourceLocator } from '../resourceLocator'
import { BaseWorkspaceWebviews } from '../webview/workspace'

export class WorkspacePlots extends BaseWorkspaceWebviews<Plots, PlotsData> {
  public readonly pathsChanged = this.dispose.track(new EventEmitter<void>())

  public createRepository(
    dvcRoot: string,
    updatesPaused: EventEmitter<boolean>,
    resourceLocator: ResourceLocator
  ) {
    const plots = this.dispose.track(
      new Plots(
        dvcRoot,
        this.internalCommands,
        updatesPaused,
        resourceLocator.scatterGraph,
        this.workspaceState
      )
    )

    this.setRepository(dvcRoot, plots)

    plots.dispose.track(
      plots.onDidChangePaths(() => {
        this.pathsChanged.fire()
      })
    )

    plots.dispose.track(
      plots.onDidChangeIsWebviewFocused(
        dvcRoot => (this.focusedWebviewDvcRoot = dvcRoot)
      )
    )

    return plots
  }

  public async selectPlots(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).selectPlots()
  }

  private async getDvcRoot(overrideRoot?: string) {
    return overrideRoot || (await this.getOnlyOrPickProject())
  }
}
