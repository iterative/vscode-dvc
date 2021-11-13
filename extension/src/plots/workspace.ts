import { Plots } from '.'
import { PlotsData } from './webview/contract'
import { ResourceLocator } from '../resourceLocator'
import { BaseWorkspaceWebviews } from '../webview/workspace'

export class WorkspacePlots extends BaseWorkspaceWebviews<Plots, PlotsData> {
  public createRepository(dvcRoot: string, resourceLocator: ResourceLocator) {
    const plots = this.dispose.track(
      new Plots(dvcRoot, this.internalCommands, resourceLocator.scatterGraph)
    )

    this.setRepository(dvcRoot, plots)

    return plots
  }

  public hideMetric(dvcRoot: string, metricId: string) {
    return this.getRepository(dvcRoot).hideMetric(metricId)
  }

  public unhideMetric(dvcRoot: string, metricId: string) {
    return this.getRepository(dvcRoot).unhideMetric(metricId)
  }

  public clearHiddenMetrics(dvcRoot: string) {
    return this.getRepository(dvcRoot).clearHiddenMetrics()
  }

  public metricIsHidden(dvcRoot: string, metricId: string) {
    return this.getRepository(dvcRoot).isMetricHidden(metricId)
  }
}
