import { Disposer } from '@hediet/std/disposable'
import { match, spy, stub } from 'sinon'
import expShowFixture from '../../fixtures/expShow/output'
import livePlotsFixture from '../../fixtures/expShow/livePlots'
import { Plots } from '../../../plots'
import { BaseWebview } from '../../../webview'
import { buildExperiments } from '../experiments/util'
import { CliReader } from '../../../cli/reader'
import { dvcDemoPath } from '../util'
import { WorkspacePlots } from '../../../plots/workspace'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { ParamOrMetric } from '../../../experiments/webview/contract'

export const buildPlots = async (disposer: Disposer, plotsShow = {}) => {
  const { experiments, internalCommands, resourceLocator } = buildExperiments(
    disposer,
    expShowFixture
  )

  const messageSpy = spy(BaseWebview.prototype, 'show')
  const mockPlotsShow = stub(CliReader.prototype, 'plotsShow').resolves(
    plotsShow
  )

  const plots = disposer.track(
    new Plots(dvcDemoPath, internalCommands, resourceLocator.scatterGraph)
  )
  plots.setExperiments(experiments)
  await plots.isReady()

  stub(WorkspaceExperiments.prototype, 'getDvcRoots').returns([dvcDemoPath])
  stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
  stub(WorkspacePlots.prototype, 'getRepository').returns(plots)

  return { experiments, messageSpy, mockPlotsShow, plots }
}

const parentPath = 'metrics:summary.json'
export const plotsMetrics = [
  {
    group: 'metrics',
    hasChildren: false,
    maxNumber: 2.048856019973755,
    maxStringLength: 18,
    minNumber: 1.775016188621521,
    name: 'loss',
    parentPath,
    path: 'metrics:summary.json:loss',
    types: match.any
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxNumber: 0.5926499962806702,
    maxStringLength: 19,
    minNumber: 0.3484833240509033,
    name: 'accuracy',
    parentPath,
    path: 'metrics:summary.json:accuracy',
    types: match.any
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxNumber: 1.9979370832443237,
    maxStringLength: 18,
    minNumber: 1.7233840227127075,
    name: 'val_loss',
    parentPath,
    path: 'metrics:summary.json:val_loss',
    types: match.any
  },
  {
    group: 'metrics',
    hasChildren: false,
    maxNumber: 0.6704000234603882,
    maxStringLength: 19,
    minNumber: 0.4277999997138977,
    name: 'val_accuracy',
    parentPath,
    path: 'metrics:summary.json:val_accuracy',
    types: match.any
  },
  {
    group: 'metrics',
    hasChildren: true,
    name: 'summary.json',
    parentPath: 'metrics',
    path: 'metrics:summary.json'
  }
] as ParamOrMetric[]

export const getExpectedData = (domain: string[], range: string[]) => {
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
      }))
    },
    metrics: plotsMetrics,
    static: undefined
  }
}
