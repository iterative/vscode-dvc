import { Disposer } from '@hediet/std/disposable'
import { spy, stub } from 'sinon'
import expShowFixture from '../../fixtures/expShow/output'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import { Plots } from '../../../plots'
import { BaseWebview } from '../../../webview'
import { buildExperiments } from '../experiments/util'
import { CliReader } from '../../../cli/reader'
import { buildMockMemento, dvcDemoPath } from '../../util'
import { WorkspacePlots } from '../../../plots/workspace'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { PlotsModel } from '../../../plots/model'
import { PlotsData } from '../../../plots/data'

export const buildPlots = async (disposer: Disposer, plotsDiff = {}) => {
  const { experiments, internalCommands, updatesPaused, resourceLocator } =
    buildExperiments(disposer, expShowFixture)

  const messageSpy = spy(BaseWebview.prototype, 'show')
  const mockPlotsDiff = stub(CliReader.prototype, 'plotsDiff').resolves(
    plotsDiff
  )

  const data = new PlotsData(dvcDemoPath, internalCommands, updatesPaused)

  const plots = disposer.track(
    new Plots(
      dvcDemoPath,
      internalCommands,
      updatesPaused,
      resourceLocator.scatterGraph,
      buildMockMemento(),
      data
    )
  )
  plots.setExperiments(experiments)
  await plots.isReady()

  stub(WorkspaceExperiments.prototype, 'getDvcRoots').returns([dvcDemoPath])
  stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
  stub(WorkspacePlots.prototype, 'getRepository').returns(plots)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plotsModel: PlotsModel = (plots as any).model

  return { data, experiments, messageSpy, mockPlotsDiff, plots, plotsModel }
}

export const getExpectedLivePlotsData = (domain: string[], range: string[]) => {
  const { plots, sectionName, selectedMetrics, size } = livePlotsFixture
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
      sectionName,
      selectedMetrics,
      size
    }
  }
}
