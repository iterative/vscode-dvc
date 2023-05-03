import { EventEmitter } from 'vscode'
import { Plots } from '.'
import { PlotsData } from './webview/contract'
import { ResourceLocator } from '../resourceLocator'
import { BaseWorkspaceWebviews } from '../webview/workspace'
import { WorkspaceExperiments } from '../experiments/workspace'

export class WorkspacePlots extends BaseWorkspaceWebviews<Plots, PlotsData> {
  public readonly pathsChanged = this.dispose.track(new EventEmitter<void>())

  public createRepository(
    dvcRoot: string,
    resourceLocator: ResourceLocator,
    experiments: WorkspaceExperiments
  ) {
    const plots = this.dispose.track(
      new Plots(
        dvcRoot,
        this.internalCommands,
        experiments.getRepository(dvcRoot),
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

  public async refresh(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).refreshPlots()
  }

  public async selectPlots(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).selectPlots()
  }

  public async addCustomPlot(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).addCustomPlot()
  }

  public async removeCustomPlots(overrideRoot?: string) {
    const dvcRoot = await this.getDvcRoot(overrideRoot)
    if (!dvcRoot) {
      return
    }
    return this.getRepository(dvcRoot).removeCustomPlot()
  }

  public getFocusedOrOnlyOrPickProject() {
    return this.focusedWebviewDvcRoot || this.getOnlyOrPickProject()
  }
}
