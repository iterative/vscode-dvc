import { stub } from 'sinon'
import { EventEmitter } from 'vscode'
import omit from 'lodash.omit'
import { WorkspaceExperiments } from '../../../experiments/workspace'
import { Experiments } from '../../../experiments'
import { Disposer } from '../../../extension'
import expShowFixture from '../../fixtures/expShow/base/output'
import { buildMockMemento, dvcDemoPath } from '../../util'
import {
  buildDependencies,
  buildInternalCommands,
  buildMockData,
  SafeWatcherDisposer
} from '../util'
import {
  ExperimentsOutput,
  EXPERIMENT_WORKSPACE_ID
} from '../../../cli/dvc/contract'
import { ExperimentsData } from '../../../experiments/data'
import { CheckpointsModel } from '../../../experiments/checkpoints/model'
import { FileSystemData } from '../../../fileSystem/data'
import * as Watcher from '../../../fileSystem/watcher'
import { ExperimentsModel } from '../../../experiments/model'
import { ColumnsModel } from '../../../experiments/columns/model'
import { DEFAULT_NUM_OF_COMMITS_TO_SHOW } from '../../../cli/dvc/constants'

const hasCheckpoints = (data: ExperimentsOutput) => {
  const [experimentsWithBaseline] = Object.values(
    omit(data, EXPERIMENT_WORKSPACE_ID)
  )
  const [firstExperiment] = Object.values(
    omit(experimentsWithBaseline, 'baseline')
  )
  const experimentFields = firstExperiment?.data

  return !!(
    experimentFields?.checkpoint_parent || experimentFields?.checkpoint_tip
  )
}

export const mockHasCheckpoints = (data: ExperimentsOutput) =>
  stub(CheckpointsModel.prototype, 'hasCheckpoints').returns(
    hasCheckpoints(data)
  )

export const buildExperiments = (
  disposer: Disposer,
  experimentShowData = expShowFixture,
  dvcRoot = dvcDemoPath
) => {
  const {
    dvcExecutor,
    dvcReader,
    dvcRunner,
    dvcViewer,
    gitReader,
    internalCommands,
    messageSpy,
    mockCheckSignalFile,
    mockExperimentShow,
    mockGetCommitMessages,
    updatesPaused,
    resourceLocator
  } = buildDependencies(disposer, experimentShowData)

  const mockUpdateExperimentsData = stub()
  const mockExperimentsData = buildMockData<ExperimentsData>(
    mockUpdateExperimentsData
  )
  const mockCheckOrAddPipeline = stub()

  const experiments = disposer.track(
    new Experiments(
      dvcRoot,
      internalCommands,
      updatesPaused,
      resourceLocator,
      buildMockMemento(),
      mockCheckOrAddPipeline,
      () => Promise.resolve([]),
      mockExperimentsData,
      buildMockData<FileSystemData>()
    )
  )

  mockHasCheckpoints(experimentShowData)

  void experiments.setState(experimentShowData)

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,
    columnsModel: (experiments as any).columns as ColumnsModel,
    dvcExecutor,
    dvcReader,
    dvcRunner,
    dvcViewer,
    experiments,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experimentsModel: (experiments as any).experiments as ExperimentsModel,
    gitReader,
    internalCommands,
    messageSpy,
    mockCheckOrAddPipeline,
    mockCheckSignalFile,
    mockExperimentShow,
    mockExperimentsData,
    mockGetCommitMessages,
    mockUpdateExperimentsData,
    resourceLocator,
    updatesPaused
  }
}

export const buildMultiRepoExperiments = (disposer: SafeWatcherDisposer) => {
  const {
    internalCommands,
    experiments: mockExperiments,
    gitReader,
    messageSpy,
    updatesPaused,
    resourceLocator
  } = buildExperiments(disposer, expShowFixture, 'other/dvc/root')

  stub(gitReader, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(
      internalCommands,
      updatesPaused,
      buildMockMemento(),
      {
        'other/dvc/root': mockExperiments
      }
    )
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    updatesPaused,
    resourceLocator
  )

  void experiments.setState(expShowFixture)
  return { experiments, internalCommands, messageSpy, workspaceExperiments }
}

export const buildSingleRepoExperiments = (disposer: SafeWatcherDisposer) => {
  const {
    config,
    internalCommands,
    gitReader,
    messageSpy,
    updatesPaused,
    resourceLocator
  } = buildDependencies(disposer)

  stub(gitReader, 'getGitRepositoryRoot').resolves(dvcDemoPath)
  const workspaceExperiments = disposer.track(
    new WorkspaceExperiments(
      internalCommands,
      updatesPaused,
      buildMockMemento()
    )
  )
  const [experiments] = workspaceExperiments.create(
    [dvcDemoPath],
    updatesPaused,
    resourceLocator
  )

  void experiments.setState(expShowFixture)

  return {
    config,
    internalCommands,
    messageSpy,
    resourceLocator,
    workspaceExperiments
  }
}

const buildExperimentsDataDependencies = (disposer: Disposer) => {
  const mockCreateFileSystemWatcher = stub(
    Watcher,
    'createFileSystemWatcher'
  ).returns(undefined)

  const { dvcReader, internalCommands } = buildInternalCommands(disposer)
  const mockExperimentShow = stub(dvcReader, 'expShow').resolves(expShowFixture)
  return { internalCommands, mockCreateFileSystemWatcher, mockExperimentShow }
}

export const buildExperimentsData = (disposer: SafeWatcherDisposer) => {
  const { internalCommands, mockExperimentShow, mockCreateFileSystemWatcher } =
    buildExperimentsDataDependencies(disposer)

  const data = disposer.track(
    new ExperimentsData(
      dvcDemoPath,
      internalCommands,
      disposer.track(new EventEmitter<boolean>()),
      {
        getIsBranchesView: () => false,
        getNbOfCommitsToShow: () => DEFAULT_NUM_OF_COMMITS_TO_SHOW
      } as ExperimentsModel
    )
  )

  return { data, mockCreateFileSystemWatcher, mockExperimentShow }
}

export const stubWorkspaceExperimentsGetters = (
  dvcRoot: string,
  experiments?: Experiments
) => {
  const mockGetOnlyOrPickProject = stub(
    WorkspaceExperiments.prototype,
    'getOnlyOrPickProject'
  ).resolves(dvcRoot)
  let mockGetRepository
  if (experiments) {
    mockGetRepository = stub(
      WorkspaceExperiments.prototype,
      'getRepository'
    ).returns(experiments)
  }

  return [mockGetOnlyOrPickProject, mockGetRepository]
}
