import { Disposer } from '@hediet/std/disposable'
import { spy, stub } from 'sinon'
import expShowFixture from '../../fixtures/expShow/output'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import { Plots } from '../../../plots'
import { BaseWebview } from '../../../webview'
import { buildExperiments } from '../experiments/util'
import { CliReader } from '../../../cli/reader'
import { dvcDemoPath } from '../../util'
import { WorkspacePlots } from '../../../plots/workspace'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { PlotSize } from '../../../plots/webview/contract'

export const buildPlots = async (disposer: Disposer, plotsShow = {}) => {
  const { experiments, internalCommands, updatesPaused, resourceLocator } =
    buildExperiments(disposer, expShowFixture)

  const messageSpy = spy(BaseWebview.prototype, 'show')
  const mockPlotsShow = stub(CliReader.prototype, 'plotsShow').resolves(
    plotsShow
  )

  const plots = disposer.track(
    new Plots(
      dvcDemoPath,
      internalCommands,
      updatesPaused,
      resourceLocator.scatterGraph
    )
  )
  plots.setExperiments(experiments)
  await plots.isReady()

  stub(WorkspaceExperiments.prototype, 'getDvcRoots').returns([dvcDemoPath])
  stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
  stub(WorkspacePlots.prototype, 'getRepository').returns(plots)

  return { experiments, messageSpy, mockPlotsShow, plots }
}

export const getExpectedLivePlotsData = (domain: string[], range: string[]) => {
  const { plots } = livePlotsFixture
  return {
    live: {
      colors: {
        domain,
        range
      },
      plots: plots.map(plot => ({
        title: plot.title,
        values: plot.values.filter(values => domain.includes(values.group))
      })),
      selectedMetrics: undefined,
      size: PlotSize.REGULAR
    }
  }
}
