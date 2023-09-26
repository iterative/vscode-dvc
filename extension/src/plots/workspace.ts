import { EventEmitter } from 'vscode'
import { Plots } from '.'
import { PlotsData } from './webview/contract'
import { PLOT_TYPE, pickPlotType } from './quickPick'
import { ResourceLocator } from '../resourceLocator'
import { BaseWorkspaceWebviews } from '../webview/workspace'
import { WorkspaceExperiments } from '../experiments/workspace'
import { WorkspacePipeline } from '../pipeline/workspace'
import { sendTelemetryEvent } from '../telemetry'
import { RegisteredCommands } from '../commands/external'
import { StopWatch } from '../util/time'

export class WorkspacePlots extends BaseWorkspaceWebviews<Plots, PlotsData> {
  public readonly pathsChanged = this.dispose.track(new EventEmitter<void>())

  public createRepository(
    dvcRoot: string,
    subProjects: string[],
    resourceLocator: ResourceLocator,
    experiments: WorkspaceExperiments
  ) {
    const plots = this.dispose.track(
      new Plots(
        dvcRoot,
        this.internalCommands,
        experiments.getRepository(dvcRoot),
        resourceLocator.scatterGraph,
        this.workspaceState,
        subProjects
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

  public async addPlot(pipelines: WorkspacePipeline, overrideRoot?: string) {
    const stopWatch = new StopWatch()
    const response: PLOT_TYPE | undefined = await pickPlotType()

    if (response === PLOT_TYPE.CUSTOM) {
      await this.addCustomPlot(overrideRoot)
    }

    if (response === PLOT_TYPE.DATA_SERIES) {
      await pipelines.addDataSeriesPlot(overrideRoot)
    }

    sendTelemetryEvent(
      RegisteredCommands.ADD_PLOT,
      { type: response },
      { duration: stopWatch.getElapsedTime() }
    )
  }

  public getFocusedOrOnlyOrPickProject() {
    return this.focusedWebviewDvcRoot || this.getOnlyOrPickProject()
  }
}
