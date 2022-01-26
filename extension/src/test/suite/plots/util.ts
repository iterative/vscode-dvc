import { Disposer } from '@hediet/std/disposable'
import { stub } from 'sinon'
import expShowFixture from '../../fixtures/expShow/output'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import { Plots } from '../../../plots'
import { buildMockMemento, dvcDemoPath } from '../../util'
import { WorkspacePlots } from '../../../plots/workspace'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { PlotsModel } from '../../../plots/model'
import { PlotsData } from '../../../plots/data'
import { Experiments } from '../../../experiments'
import { buildDependencies, buildMockData } from '../util'

export const buildPlots = async (
  disposer: Disposer,
  plotsDiff = {},
  expShow = expShowFixture
) => {
  const {
    internalCommands,
    mockPlotsDiff,
    messageSpy,
    updatesPaused,
    resourceLocator
  } = buildDependencies(disposer, expShow, plotsDiff)

  const data = new PlotsData(dvcDemoPath, internalCommands, updatesPaused)

  const [experiments, plots] = await Promise.all([
    disposer.track(
      new Experiments(
        dvcDemoPath,
        internalCommands,
        updatesPaused,
        resourceLocator,
        buildMockMemento(),
        buildMockData()
      )
    ),
    disposer.track(
      new Plots(
        dvcDemoPath,
        internalCommands,
        updatesPaused,
        resourceLocator.scatterGraph,
        buildMockMemento(),
        data
      )
    )
  ])
  experiments.setState(expShow)
  plots.setExperiments(experiments)

  await plots.isReady()

  stub(WorkspaceExperiments.prototype, 'getDvcRoots').returns([dvcDemoPath])
  stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
  stub(WorkspacePlots.prototype, 'getRepository').returns(plots)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plotsModel: PlotsModel = (plots as any).model

  return {
    data,
    experiments,
    messageSpy,
    mockPlotsDiff,
    plots,
    plotsModel
  }
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
