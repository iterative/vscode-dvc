import { Disposer } from '@hediet/std/disposable'
import { stub } from 'sinon'
import * as FileSystem from '../../../fileSystem'
import expShowFixtureWithoutErrors from '../../fixtures/expShow/base/noErrors'
import { customPlotsOrderFixture } from '../../fixtures/expShow/base/customPlots'
import { Plots } from '../../../plots'
import { buildMockMemento, dvcDemoPath } from '../../util'
import { WorkspacePlots } from '../../../plots/workspace'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { PlotsModel } from '../../../plots/model'
import { PlotsData } from '../../../plots/data'
import { Experiments } from '../../../experiments'
import { buildDependencies, buildMockExperimentsData } from '../util'
import { MOCK_IMAGE_MTIME } from '../../fixtures/plotsDiff'
import { PathsModel } from '../../../plots/paths/model'
import { BaseWorkspaceWebviews } from '../../../webview/workspace'
import { WebviewMessages } from '../../../plots/webview/messages'
import { ExperimentsModel } from '../../../experiments/model'
import { Experiment } from '../../../experiments/webview/contract'
import { EXPERIMENT_WORKSPACE_ID, PlotsOutput } from '../../../cli/dvc/contract'
import { ErrorsModel } from '../../../plots/errors/model'
import { PersistenceKey } from '../../../persistence/constants'

export const buildPlots = async (
  disposer: Disposer,
  plotsDiff: PlotsOutput | undefined = undefined,
  expShow = expShowFixtureWithoutErrors
) => {
  const {
    internalCommands,
    mockPlotsDiff,
    messageSpy,
    updatesPaused,
    resourceLocator
  } = buildDependencies(disposer, expShow, plotsDiff)

  const mockRemoveDir = stub(FileSystem, 'removeDir').returns(undefined)
  const mockGetModifiedTime = stub(FileSystem, 'getModifiedTime').returns(
    MOCK_IMAGE_MTIME
  )

  const experiments = disposer.track(
    new Experiments(
      dvcDemoPath,
      internalCommands,
      updatesPaused,
      resourceLocator,
      buildMockMemento({
        [`${PersistenceKey.EXPERIMENTS_BRANCHES}${dvcDemoPath}`]: ['current'],
        [`${PersistenceKey.NUMBER_OF_COMMITS_TO_SHOW}${dvcDemoPath}`]: {
          current: 5
        }
      }),
      () => Promise.resolve(true),
      () => Promise.resolve([]),
      buildMockExperimentsData()
    )
  )
  const plots = disposer.track(
    new Plots(
      dvcDemoPath,
      internalCommands,
      experiments,
      updatesPaused,
      resourceLocator.scatterGraph,
      buildMockMemento()
    )
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const experimentsModel: ExperimentsModel = (experiments as any).experiments
  experimentsModel.setSelected([
    { id: EXPERIMENT_WORKSPACE_ID },
    { id: 'main' },
    { id: 'exp-e7a67' },
    { id: 'test-branch' },
    { id: 'exp-83425' },
    { id: 'exp-f13bca' }
  ] as Experiment[])

  void experiments.setState(expShow)

  await plots.isReady()

  stub(BaseWorkspaceWebviews.prototype, 'getDvcRoots').returns([dvcDemoPath])
  stub(WorkspaceExperiments.prototype, 'getRepository').returns(experiments)
  stub(WorkspacePlots.prototype, 'getRepository').returns(plots)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: PlotsData = (plots as any).data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plotsModel: PlotsModel = (plots as any).plots
  plotsModel.updateCustomPlotsOrder(customPlotsOrderFixture)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pathsModel: PathsModel = (plots as any).paths

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorsModel: ErrorsModel = (plots as any).errors

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webviewMessages: WebviewMessages = (plots as any).webviewMessages

  return {
    data,
    errorsModel,
    experiments,
    experimentsModel,
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

export const buildWorkspacePlots = (disposer: Disposer) => {
  const { config, internalCommands, messageSpy, resourceLocator } =
    buildDependencies(disposer)

  const workspacePlots = disposer.track(
    new WorkspacePlots(internalCommands, buildMockMemento())
  )

  return {
    config,
    internalCommands,
    messageSpy,
    resourceLocator,
    workspacePlots
  }
}
