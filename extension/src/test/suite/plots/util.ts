import { Disposer } from '@hediet/std/disposable'
import { stub } from 'sinon'
import * as FileSystem from '../../../fileSystem'
import expShowFixtureWithoutErrors from '../../fixtures/expShow/base/noErrors'
import gitLogFixture from '../../fixtures/expShow/base/gitLog'
import rowOrderFixture from '../../fixtures/expShow/base/rowOrder'
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
import {
  EXPERIMENT_WORKSPACE_ID,
  ExpShowOutput,
  PlotsOutput
} from '../../../cli/dvc/contract'
import { ErrorsModel } from '../../../plots/errors/model'
import { PersistenceKey } from '../../../persistence/constants'
import { buildExperimentsPipeline } from '../pipeline/util'

export const buildPlots = async ({
  availableNbCommits = { main: 5 },
  disposer,
  plotsDiff = undefined,
  expShow = expShowFixtureWithoutErrors,
  gitLog = gitLogFixture,
  rowOrder = rowOrderFixture
}: {
  availableNbCommits?: { [branch: string]: number }
  disposer: Disposer
  plotsDiff?: PlotsOutput | undefined
  expShow?: ExpShowOutput
  gitLog?: string
  rowOrder?: { branch: string; sha: string }[]
}) => {
  const { internalCommands, mockPlotsDiff, messageSpy, resourceLocator } =
    buildDependencies({ disposer, expShow, plotsDiff })

  const mockRemoveDir = stub(FileSystem, 'removeDir').returns(undefined)
  const mockGetModifiedTime = stub(FileSystem, 'getModifiedTime').returns(
    MOCK_IMAGE_MTIME
  )

  const pipeline = buildExperimentsPipeline({
    disposer,
    dvcRoot: dvcDemoPath,
    internalCommands
  })

  const experiments = disposer.track(
    new Experiments(
      dvcDemoPath,
      internalCommands,
      pipeline,
      resourceLocator,
      buildMockMemento({
        [`${PersistenceKey.EXPERIMENTS_BRANCHES}${dvcDemoPath}`]: ['main'],
        [`${PersistenceKey.NUMBER_OF_COMMITS_TO_SHOW}${dvcDemoPath}`]: {
          main: 5
        }
      }),
      () => Promise.resolve([]),
      [],
      buildMockExperimentsData()
    )
  )
  const plots = disposer.track(
    new Plots(
      dvcDemoPath,
      internalCommands,
      experiments,
      resourceLocator.scatterGraph,
      buildMockMemento(),
      []
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

  void experiments.setState({
    availableNbCommits,
    expShow,
    gitLog,
    rowOrder
  })

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
