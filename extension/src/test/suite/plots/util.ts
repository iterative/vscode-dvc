import { Disposer } from '@hediet/std/disposable'
import { stub } from 'sinon'
import * as FileSystem from '../../../fileSystem'
import expShowFixture from '../../fixtures/expShow/output'
import checkpointPlotsFixture from '../../fixtures/expShow/checkpointPlots'
import { Plots } from '../../../plots'
import { buildMockMemento, dvcDemoPath } from '../../util'
import { WorkspacePlots } from '../../../plots/workspace'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { PlotsModel } from '../../../plots/model'
import { PlotsData } from '../../../plots/data'
import { Experiments } from '../../../experiments'
import { buildDependencies, buildMockData } from '../util'
import { FileSystemData } from '../../../fileSystem/data'
import { ExperimentsData } from '../../../experiments/data'
import { mockHasCheckpoints } from '../experiments/util'
import { MOCK_IMAGE_MTIME } from '../../fixtures/plotsDiff'
import { PathsModel } from '../../../plots/paths/model'
import { Color } from '../../../experiments/model/status/colors'
import { BaseWorkspaceWebviews } from '../../../webview/workspace'
import { WebviewMessages } from '../../../plots/webview/messages'

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

  const mockRemoveDir = stub(FileSystem, 'removeDir').returns(undefined)
  const mockGetModifiedTime = stub(FileSystem, 'getModifiedTime').returns(
    MOCK_IMAGE_MTIME
  )

  const [experiments, plots] = await Promise.all([
    disposer.track(
      new Experiments(
        dvcDemoPath,
        internalCommands,
        updatesPaused,
        resourceLocator,
        buildMockMemento(),
        buildMockData<ExperimentsData>(),
        buildMockData<FileSystemData>()
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
  mockHasCheckpoints(expShow)
  experiments.setState({
    expShow,
    queueStatus: 'Worker status: 0 active, 0 idle'
  })
  plots.setExperiments(experiments)

  await plots.isReady()

  stub(BaseWorkspaceWebviews.prototype, 'getDvcRoots').returns([dvcDemoPath])
  stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
  stub(WorkspacePlots.prototype, 'getRepository').returns(plots)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plotsModel: PlotsModel = (plots as any).plots

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pathsModel: PathsModel = (plots as any).paths

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webviewMessages: WebviewMessages = (plots as any).webviewMessages

  return {
    data,
    experiments,
    messageSpy,
    mockGetModifiedTime,
    mockPlotsDiff,
    mockRemoveDir,
    pathsModel,
    plots,
    plotsModel,
    webviewMessages
  }
}

export const getExpectedCheckpointPlotsData = (
  domain: string[],
  range: Color[]
) => {
  const { plots, selectedMetrics, size } = checkpointPlotsFixture
  return {
    checkpoint: {
      colors: {
        domain,
        range
      },
      plots: plots.map(plot => ({
        title: plot.title,
        values: plot.values.filter(values => domain.includes(values.group))
      })),
      selectedMetrics,
      size
    }
  }
}
